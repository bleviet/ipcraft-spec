<!-- editorconfig-checker-disable-file -->
<!-- YAML examples use two-space indentation. -->

# Define a Data Inspector Recipe

An `*.ipci.yml` file saves a reusable Data Inspector layout. It stores source
widths, fields, operations, and view settings. It does not store pasted values,
waveforms, CSV rows, or capture history.

Recipes are normally created and edited with IPCraft for VS Code. Use this
reference when reviewing or generating a recipe directly.

## Start with the smallest valid recipe

```yaml
version: 1
name: status-register

sources:
  - id: status
    name: STATUS
    width: 32

overlayGroups:
  - id: decoded
    name: Decoded fields

fields: []
steps: []

view:
  laneWidth: 32
  zoom: field
```

## Understand the saved structure

| Section | Purpose |
|---|---|
| `version` | Recipe format version; currently `1` |
| `name` | Required recipe name |
| `description` | Optional explanation |
| `sources` | Named inputs and their widths |
| `overlayGroups` | Independent field layouts |
| `fields` | Named ranges decoded from sources |
| `steps` | Operations that combine or change values |
| `view` | Lane width, zoom, selection, and canvas positions |

Every object uses a stable `id`. References such as `sourceId`, `groupId`,
`inputId`, and `operandId` must match those IDs.

## Add sources

```yaml
sources:
  - id: address-high
    name: ADDR_HI
    width: 32
  - id: address-low
    name: ADDR_LO
    width: 32
```

Source widths can range from 1 to 4096 bits. Sample values remain temporary and
are supplied after the recipe opens.

## Add overlay groups and fields

An overlay group is one non-overlapping view of the bits. Create another group
when the same bits need a second interpretation.

```yaml
overlayGroups:
  - id: decoded
    name: Decoded fields

fields:
  - id: state
    sourceId: status
    name: STATE
    msb: 3
    lsb: 1
    groupId: decoded
    description: Current state
    enumValues:
      '0': IDLE
      '1': RUN
      '2': ERROR
    display:
      interpretation: enum
      expectedValue: '1'
```

| Field | Purpose |
|---|---|
| `id` | Stable field identifier |
| `sourceId` | Source decoded by the field |
| `name` | Display name |
| `msb`, `lsb` | Inclusive bit range |
| `groupId` | Overlay group containing the field |
| `description` | Optional explanation |
| `enumValues` | Map numeric strings to labels |
| `importProvenance` | Memory-map file and register copied into the recipe |
| `display` | Interpretation and comparison settings |

`display.interpretation` can be `hex`, `binary`, `unsigned`, `signed`, `enum`,
`float`, or `fixedPoint`. A fixed-point field also uses `fractionalBits`.
`expectedValue` adds a comparison without changing the sample.

## Add operations

Operations refer to a source or earlier operation by ID.

```yaml
steps:
  - id: address
    type: concat
    inputId: address-high
    operandId: address-low
```

For `concat`, `inputId` supplies the high bits and `operandId` supplies the low
bits.

| Operation | Extra fields | Result |
|---|---|---|
| `concat` | `operandId` | Join high and low values |
| `slice` | `msb`, `lsb` | Keep one inclusive range |
| `and`, `or`, `xor` | `operandId` | Apply bit logic to equal-width values |
| `not` | None | Invert every bit |
| `shiftLeft`, `shiftRight` | `amount` | Shift within the same width |
| `zeroExtend`, `signExtend` | `width` | Increase the width |
| `truncate` | `width` | Keep the low bits at a smaller width |
| `byteSwap` | None | Reverse bytes in a byte-aligned value |

`inputId` is required for every operation. Use unique IDs so later operations
can refer to earlier results.

## Save view settings

```yaml
view:
  laneWidth: 32
  zoom: field
  selectedGroupId: decoded
  canvas:
    nodes:
      - id: status
        x: 80
        y: 120
```

`laneWidth` can be 8, 16, 32, or 64. `zoom` can be `overview`, `field`, or
`bit`. Canvas positions are optional and affect layout only.

## Continue with an example

- `examples/data_inspector/comprehensive_axi_status.ipci.yml` decodes a
  register and displays an enum.
- `examples/data_inspector/split_address.ipci.yml` combines two 32-bit sources
  into one 64-bit address.
