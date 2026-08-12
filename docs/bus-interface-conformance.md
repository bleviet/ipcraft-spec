# Bus Interface Conformance

IPCraft's built-in bus definitions are executable contracts. Each definition
declares its canonical identity, compatibility aliases, interface kind, modes,
port roles, width policies, semantic properties, and stable validation rules.
The contract is the source of truth for parsing, editing, validation, import,
and generation.

## Contract version 1

A version-1 contract contains:

- `busType.displayName`: the presentation label used by contract-library UIs;
- `interfaceKind`: `memoryMapped`, `streaming`, or `conduit`;
- `modePolicy`: canonical producer and consumer modes plus explicit aliases;
- `interfaceProperties`: typed protocol properties, defaults, and derivations;
- `constraints`: stable rule identifiers and structured operands; and
- port-level `role`, `presence`, `widthPolicy`, and optional `derivedWidth`.

A derived port may declare `overrideConstraintRuleId` to link an authored
override to the exact stable rule that validates it. This is an explicit
contract reference; rule identifiers and protocol or port names are never
inspected for substrings to infer behavior.

The schema is `schemas/bus_definition.schema.json`. Legacy workspace bus
definitions may omit `contract`, `role`, and `widthPolicy`. They remain usable,
but do not receive protocol conformance checking. All definitions shipped with
IPCraft contain a complete version-1 contract.

Short aliases are case-insensitive after trimming. Full VLNV aliases match
vendor, library, and name exactly. A version matches exactly unless the alias
explicitly declares `version: '*'`.

## Width policies

- `root` widths are chosen by the interface author. Examples are AXI `TDATA`,
  Avalon-ST `data`, and memory-mapped address widths.
- `derived` widths are computed from roots or semantic properties. Examples
  are `TKEEP = TDATA / 8`, `WSTRB = WDATA / 8`, and Avalon-ST
  `empty = ceil(log2(symbolsPerBeat))`.
- `fixed` widths are protocol constants. Handshake signals are one bit, while
  fields such as AXI `BRESP` retain their declared protocol width.

An explicit derived or fixed override is valid only when it equals the
contract result. A root edit removes now-redundant or invalid coupled derived
overrides atomically.

## AXI4-Stream byte qualifiers

AXI4-Stream data is byte aligned. `TKEEP` and `TSTRB`, when enabled, contain one
bit per byte lane.

```yaml
busInterfaces:
  - name: samples
    type: ipcraft:busif:axi_stream:1.0
    mode: master
    useOptionalPorts: [TKEEP]
    portWidthOverrides:
      TDATA: 64
      TKEEP: 8
```

The `TKEEP` override is compatible but redundant. Changing `TDATA` to 32 makes
the effective `TKEEP` width 4.

## Avalon-ST symbol layout

Avalon-ST separates symbol size from symbols per beat:

```text
data width = dataBitsPerSymbol * symbolsPerBeat
empty width = ceil(log2(symbolsPerBeat))
```

For conventional byte symbols, a 32-bit stream contains four symbols and
requires a two-bit `empty` signal when packet support is active:

```yaml
busInterfaces:
  - name: packetSink
    type: ipcraft:busif:avalon_st:1.0
    mode: sink
    useOptionalPorts: [startofpacket, endofpacket, empty]
    portWidthOverrides:
      data: 32
      empty: 2
    interfaceProperties:
      dataBitsPerSymbol: 8
      symbolsPerBeat: 4
```

Symbol width is not restricted to a byte or a power of two. A five-bit stream
with one-bit symbols is valid and uses a three-bit `empty` signal:

```yaml
busInterfaces:
  - name: bitStream
    type: ipcraft:busif:avalon_st:1.0
    mode: source
    useOptionalPorts: [startofpacket, endofpacket, empty]
    portWidthOverrides:
      data: 5
      empty: 3
    interfaceProperties:
      dataBitsPerSymbol: 1
      symbolsPerBeat: 5
```

For Avalon-ST, `endianness: big` reverses symbol lanes. It does not imply
eight-bit byte lanes. `firstSymbolInHighOrderBits` is a vendor representation
of `endianness` and is not stored in `interfaceProperties`.

`readyLatency` defaults to zero. If `channel` is enabled and `maxChannel` is
omitted, IPCraft derives `maxChannel` as `2^channelWidth - 1`.

## Parameterized interfaces

Root widths and semantic values may reference IP parameters. The validator
checks the default and the complete dependency-sliced `allowedValues` domain
when that domain contains at most 256 combinations.

```yaml
parameters:
  - name: DATA_WIDTH
    value: 32
    dataType: integer
    allowedValues: [16, 32, 64]
  - name: SYMBOLS_PER_BEAT
    value: 4
    dataType: integer
    allowedValues: [2, 4, 8]

busInterfaces:
  - name: streamOut
    type: ipcraft:busif:avalon_st:1.0
    mode: source
    portWidthOverrides:
      data: DATA_WIDTH
    interfaceProperties:
      dataBitsPerSymbol: 8
      symbolsPerBeat: SYMBOLS_PER_BEAT
```

Every declared combination must satisfy the data-layout rule. An oversized
domain is reported as unresolved and is never sampled.

## Vendor round trips

Platform Designer `_hw.tcl` import and export map the following Avalon-ST
properties to the canonical interface model:

| Vendor property | IPCraft field |
|---|---|
| `dataBitsPerSymbol` | `interfaceProperties.dataBitsPerSymbol` |
| `symbolsPerBeat` | `interfaceProperties.symbolsPerBeat` |
| `readyLatency` | `interfaceProperties.readyLatency` |
| `maxChannel` | `interfaceProperties.maxChannel` |
| `firstSymbolInHighOrderBits` | `endianness` |

Custom IP-XACT output mirrors the canonical property map and endianness in the
`urn:ipcraft:interface-contract:1` namespace. If standard IP-XACT parameters
and the mirror disagree, IPCraft reports a blocking conflict instead of
guessing which representation wins.

## Stable built-in rules

The built-in contracts use stable diagnostic identifiers:

| Contract | Error rules | Warning rules |
|---|---|---|
| AXI4-Lite | `AXI4L_DATA_WIDTH`, `AXI4L_DATA_EQUAL`, `AXI4L_WSTRB_WIDTH`, `AXI4L_ADDRESS_EQUAL` | None |
| AXI4 Full | `AXI4_DATA_WIDTH`, `AXI4_DATA_EQUAL`, `AXI4_WSTRB_WIDTH`, `AXI4_ID_WIDTHS`, fixed widths, presence dependencies | None |
| AXI4-Stream | `AXIS_DATA_BYTE_ALIGNED`, `AXIS_TKEEP_WIDTH`, `AXIS_TSTRB_WIDTH`, fixed handshake widths | `AXIS_PREFERRED_DATA_WIDTH` |
| Avalon-MM | `AVALON_MM_DATA_WIDTH`, `AVALON_MM_DATA_EQUAL`, `AVALON_MM_BYTEENABLE_WIDTH`, fixed control widths | None |
| Avalon-ST | `AVALON_ST_DATA_LAYOUT`, `AVALON_ST_EMPTY_WIDTH`, `AVALON_ST_PACKET_PORTS`, `AVALON_ST_READY_LATENCY`, `AVALON_ST_MAX_CHANNEL` | None |

Diagnostics retain array-form document paths. Rendered dotted paths are for
display only and must not be parsed back into edit locations.
