<!-- editorconfig-checker-disable-file -->
<!-- YAML examples use two-space indentation. -->

# Define a Stream Packet Format

A `*.pkt.yml` file describes what a streaming interface carries: the fields of
each beat, how many beats a frame has, and what the values mean. A stream bus
interface in an `.ip.yml` points to one format with `packetFormatRef`. Tools
use the format to show the bit mapping, decode captured data, and build or check
frames in testbenches.

A packet format is metadata only: HDL generators ignore it.

## Start with the smallest valid file

```yaml
pktVersion: 1
packetFormats:
  - name: sample
    dataWidth: 32
    beats:
      - name: sample
        signals:
          data:
            - { name: value, bits: "[15:0]" }
            - { name: channel, bits: "[19:16]" }
```

## Document structure

| Key | Required | Meaning |
|---|---|---|
| `pktVersion` | yes | Format version, currently `1`. A tool refuses a file with a newer version. |
| `description` | no | Free text |
| `imports` | no | Paths of other `*.pkt.yml` files, relative to this file. Their formats and enums become visible. |
| `enums` | no | Named value tables, see [Enums](#enums) |
| `packetFormats` | yes | List of formats |

Keys starting with `x-` are allowed on the document, a format, a beat section,
a field and an enum. Tools that do not know them ignore them.

## Packet format

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | Unique among all formats visible in the file (own and imported) |
| `description` | no | Free text |
| `busTypes` | no | Bus definition names (`axi_stream`, `avalon_st`, ...) this format may be used with. Absent: any streaming bus. |
| `dataWidth` | yes, unless `extends` | Width of the data signal in bits |
| `beats` | yes, unless `extends` | Ordered beat sections |
| `extends` | no | Name of the base format, see [Refine a format](#refine-a-format) |
| `refine` | only with `extends` | Additions to the fields of the base |

### Signals

`signals` maps a signal to its fields. The key `data` names the data signal of any
streaming bus (`TDATA` of AXI4-Stream, `data` of Avalon-ST). Other keys are
logical port names of the bus definition (`TUSER`, `TDEST`, `TID`, `channel`,
`error`, ...), compared case-insensitively. Writing `TDATA` is accepted and means
`data`.

Signals that a section does not list are not interpreted.

### Beat sections

A frame is the concatenation of the beat sections in order.

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | Unique in the format |
| `description` | no | |
| `count` | no | Number of beats, default `1`; see below |
| `signals` | no | Fields per signal. A section without `signals` is opaque. |

`count` is one of:

- an integer `>= 0`;
- `{ field: <path>, perBeat: <n>, add: <k> }`: the value of an earlier field, plus `add`
  (default 0), divided by `perBeat` (default 1) and rounded up. The field must belong
  to an earlier section whose count is `1`.
- `untilLast`: the remaining beats up to and including the beat that ends the frame
  (`TLAST` on AXI4-Stream, `endofpacket` on Avalon-ST). Only the last section can use it.

Version 1 does not interpret `TKEEP`, `TSTRB` or `empty`: every beat is decoded at full width.

### Fields

A field is the `portFields` entry of `.ip.yml`, extended; every valid port field is a
valid packet field:

| Key | Meaning |
|---|---|
| `name` | Required. Field names are unique across all sections and signals of a format; nested names are unique among siblings. |
| `bits` | `"[msb:lsb]"` or `"[bit]"` |
| `offset`, `width` | Alternative to `bits`; give either `bits` or `offset` + `width`, not both |
| `description` | Free text |
| `type` | `uint` (default), `int` (two's complement), `bool` (1 bit), `enum`, `bytes` (width multiple of 8, little endian), `reserved` (decoded, hidden by default). An unknown type decodes as `uint`. |
| `enum` | Name of an enum; sets `type: enum` when `type` is absent |
| `enumeratedValues` | Inline map `{value: name}`, as on a port field; an unnamed enum. Excludes `enum`. |
| `unit`, `scale`, `offsetValue` | Engineering value = raw x `scale` (default 1) + `offsetValue` (default 0); `unit` is display text |
| `fields` | Sub-fields; their bits are relative to this field |
| `format` | Name of a single-beat format whose `data` fields fill this field (composition). Its `dataWidth` must equal the field width. Excludes `fields`. |
| `array` | `{ count: <n>, stride: <bits> }`: element `i` sits at `lsb + i x stride` (default stride = width). Sub-fields apply to every element. |
| `constraints` | `{ min, max, const }`: checked by validators and testbenches, not by decoders |

Bit 0 is the least significant bit of the signal (or of the parent field). Sibling
fields must not overlap, and every field must fit into its parent (the signal width
for `data` is `dataWidth`).

A field path joins names with `.`: `header.length`, or `payload.arm_id` for a sub-field.
The section name is not part of a path.

## Enums

```yaml
enums:
  prio_t: { 0: HIGH, 1: NORMAL, 2: LOW }
  status_t:
    flags: true               # bit set: each value is one bit
    values:
      0x01: { name: OVERRUN, description: FIFO overrun }
      0x02: UNDERRUN
```

A short form (a plain map) means `flags: false`. A value is a name or `{ name, description }`.
Enum names are unique among all visible files.

## Multi-beat example

```yaml
pktVersion: 1
packetFormats:
  - name: telegram
    dataWidth: 32
    busTypes: [axi_stream]
    beats:
      - name: header
        signals:
          data:
            - { name: tid, bits: "[11:0]" }
            - { name: elements, bits: "[31:16]" }
          TUSER:
            - { name: first, bits: "[0]", type: bool }
      - name: body
        count: { field: elements, perBeat: 2 }
        signals:
          data:
            - { name: element, bits: "[15:0]", array: { count: 2, stride: 16 } }
```

## Refine a format

A format with `extends` copies its base and may only **add detail**. The bit layout of
every refined format equals the layout of its base, so a decoder that only knows the
base still reads every packet.

```yaml
  - name: link_event
    extends: event
    description: Event raised per sent link frame
    refine:
      payload:
        description: Link that sent the frame
        fields:
          - { name: link_id, bits: "[7:0]" }
          - { name: lane, bits: "[14:8]" }
      timestamp.qualifier:
        constraints: { const: 0x0A }
```

`refine` maps a field path of the base to a patch. A patch may set `description`, `type`,
`enum`, `unit`, `scale`, `offsetValue`, `constraints`, and `fields` to add sub-fields to a
field that has none (or more sub-fields that do not overlap the existing ones).
It may not change `bits`, `offset`, `width`, `array` or `format`, nor the sections or `dataWidth`.
A format may also refine a field it inherited through a composition (`event.payload`).

## Assign a format to an interface

In an `.ip.yml` (apiVersion 1.3), a bus interface of a streaming bus type names its format:

```yaml
busInterfaces:
  - name: m_axis_evt
    type: ipcraft:busif:axi_stream:1.0
    mode: master
    portWidthOverrides: { TDATA: 160, TUSER: 2 }
    packetFormatRef: packets/event.pkt.yml#link_event
```

The reference is `<path relative to the .ip.yml>#<format name>`. For an array interface the
format applies to every instance. Tools report an error if the bus type is not streaming,
if the format's `busTypes` excludes it, or if `dataWidth` differs from the resolved data
width of the interface. If the interface also has `portFields`, the packet format wins.

## Bind formats to a merged stream

Where packets of several producers share one stream (a router, a mux, a capture buffer),
a `*.pktmap.yml` file maps the value that identifies the producer to its format:

```yaml
pktVersion: 1
name: capture
description: Inputs of the capture router
base: ../packets/event.pkt.yml#event
selector: src_port
sources:
  0: { name: generator }
  1: { name: link_tx, format: ../packets/link.pkt.yml#link_event }
```

| Key | Required | Meaning |
|---|---|---|
| `pktVersion` | yes | `1` |
| `name` | yes | |
| `base` | yes | Format reference used when a value has no `format` or is not listed |
| `selector` | yes | Name of the value that selects the producer (a field path or a capture column) |
| `sources` | yes | Map from integer value to `{ name, format, description }` |
| `formats` | no | Extra format references to include in the resolved output (for example a capture record) |

Every source format must be the base itself or extend it (directly or indirectly).

## Validation errors

Implementations report these codes (with file, field path and a message):

| Code | Cause |
|---|---|
| `PKT_VERSION` | `pktVersion` missing, not an integer, or newer than supported |
| `SCHEMA` | A key or value does not match the schema |
| `DUPLICATE_NAME` | Two formats, enums, sections, fields of one format, or siblings share a name |
| `BITS` | Malformed `bits`, `bits` together with `offset`/`width`, or no position |
| `FIELD_RANGE` | A field does not fit its parent or the data signal |
| `FIELD_OVERLAP` | Sibling fields overlap |
| `UNKNOWN_REF` | Unknown format, enum, import file, or refined path |
| `EXTENDS_CYCLE` | A format extends itself, directly or indirectly |
| `REFINE` | A patch changes the layout, or adds sub-fields that overlap |
| `COMPOSITION` | A composed format is not single-beat, or its `dataWidth` differs from the field width |
| `COUNT` | A `count` field is not in an earlier section with count 1, or `untilLast` is not in the last section |
| `MAP_BASE` | A source format of a `*.pktmap.yml` does not derive from `base` |

## Resolved form

Tools exchange formats as **resolved JSON**: imports, `extends`, compositions and enum
references are expanded, and every field carries absolute bits. A tool that only decodes
reads this form and needs no YAML.

```json
{
  "resolvedPktVersion": 1,
  "formats": {
    "event": {
      "name": "event", "description": "", "dataWidth": 32, "busTypes": [], "extends": [],
      "beats": [
        { "name": "event", "description": "", "count": 1,
          "signals": { "data": [
            { "name": "id", "path": "id", "lsb": 0, "width": 16, "type": "uint", "description": "" } ] } }
      ]
    }
  },
  "map": { "name": "capture", "description": "", "selector": "src_port", "base": "event",
           "sources": { "1": { "name": "link_tx", "format": "link_event", "description": "" } } }
}
```

- `formats` holds every format reachable from the input, keyed by name. `extends` lists the
  base chain, nearest first.
- `count` is an integer, `"untilLast"`, or `{ "field", "perBeat", "add" }` with defaults filled in.
- A resolved field has `name`, `path`, `lsb` and `width` (absolute within the signal), `type`,
  `description`, and only when set: `enum` (`{ "name", "flags", "description", "values": { "<int>": { "name", "description" } } }`,
  `name` is empty for inline `enumeratedValues`; a field with an enum and no explicit `type` gets type `enum`),
  `unit`, `scale`, `offsetValue`, `constraints`, `array`, `format` (the composed format's name),
  `fields`, and `x-*` keys.
- `map` is present when a `*.pktmap.yml` was resolved; `sources` keys are decimal strings and
  every source has its `format` filled in (the base when absent).

## Decoded form

Decoding a frame gives one entry per top-level field name. For a field of a section with
count 1 the value is a scalar or a nested object of sub-fields; for a section with another
count it is a list with one entry per beat (an empty list when the section has no beats);
an `array` field gives a list of elements. Each leaf carries the raw integer, the
engineering value (sign, `bool`, `bytes`, `scale`/`offsetValue` applied) and the enum
name when an enum matches. For a flags enum the text is the names of the set bits joined
with `|`, followed by any undefined set bits in hex; a zero value matches only an explicit
`0` entry.

A decoder never fails on a damaged frame. Fewer beats than the sections need mark the
frame **truncated** (the sections decoded so far are kept); beats after the last section
are **trailing**. A count field that cannot be read gives 0 beats.

## Conformance vectors

`examples/packet_formats/*.vectors.yml` pair an input file with its expected resolved JSON
and decoded frames. Every implementation runs them:

```yaml
input: link.pkt.yml           # or a .pktmap.yml
resolved: link.resolved.json  # resolve(input) must equal this file
cases:
  - name: refined format adds sub-fields
    format: link_event
    beats:                    # an integer (the data signal) or a map signal -> integer, per beat
      - { data: 0x4433072A0A00123456789ABC00000011872A0005, TUSER: 1 }
    truncated: false          # optional, default false
    trailing: 0               # optional, number of trailing beats
    decoded:
      payload: { raw: 0x72A, link_id: 0x2A, lane: 7 }
      prio: { raw: 1, text: NORMAL }
map:                          # optional, for a .pktmap.yml: selector value -> source
  - { key: 9, name: null, format: event }   # unknown key: no name, the base format
```

`decoded` lists only the paths to check. A field with sub-fields compares as an object whose
`raw` key is the whole field value; a leaf compares as its raw integer, or as an object with
any of the `raw`, `value` and `text` keys. Encoding the decoded frame of a complete case must
give the input beats again. `invalid/invalid.vectors.yml` lists files that must fail with the
given error code.
