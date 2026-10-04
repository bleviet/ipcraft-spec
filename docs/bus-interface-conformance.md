# Bus Interface Conformance

**Writing style:** This document follows the writing rules of ASD-STE100
Simplified Technical English: short sentences, one idea in each sentence,
active voice, and one term for each concept. It does not use the STE
dictionary, because the document needs software terms that the dictionary
does not contain.

## Summary

- Each built-in bus definition contains a **contract**. The contract gives the
  rules for a bus interface: its ports, port widths, modes, and protocol
  properties.
- IPCraft uses the contract when it parses, edits, validates, imports, and
  generates a bus interface. The contract is the only source of these rules.
- Each port width has one of three policies: the user selects it (`root`),
  IPCraft calculates it (`derived`), or the protocol sets it (`fixed`).
- When IPCraft finds a problem, it reports a diagnostic with a stable rule ID.

## Terms

| Term               | Meaning                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Bus definition     | A YAML entry in `bus_definitions/` that lists the ports of one bus type.                      |
| Contract           | The `contract` section of a bus definition. It contains the conformance rules.                |
| Bus interface      | One entry in `busInterfaces` of an `.ip.yml` file. It uses one bus definition.                |
| VLNV               | The `vendor:library:name:version` identifier of a bus type.                                   |
| Alias              | A different name that IPCraft maps to the canonical VLNV, for example `AXI4L`.                |
| Root width         | A port width that the user selects, for example AXI `TDATA`.                                  |
| Derived width      | A port width that IPCraft calculates from other values, for example `TKEEP = TDATA / 8`.      |
| Fixed width        | A port width that the protocol sets, for example `TVALID = 1`.                                |
| Override           | A value in `portWidthOverrides` or `portPolarityOverrides` that the user writes for one port. |
| Interface property | A protocol value that is not a signal, for example `symbolsPerBeat`.                          |
| Rule ID            | The stable identifier of one contract rule, for example `AXIS_TKEEP_WIDTH`.                   |
| Diagnostic         | One reported problem. It has a rule ID, a severity, and the YAML path of the problem.         |
| Unresolved         | IPCraft cannot prove that the interface is correct or incorrect.                              |

## 1. Contract version 1

### 1.1 Contents

A version-1 contract has these parts:

| Part                            | Purpose                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `busType.displayName`           | The label that the user interface shows for the bus type.                      |
| `interfaceKind`                 | The kind of interface: `memoryMapped`, `streaming`, or `conduit`.              |
| `modePolicy`                    | The two canonical modes (producer and consumer) and the aliases for each mode. |
| `interfaceProperties`           | The protocol properties, with their types, default values, and calculations.   |
| `constraints`                   | The rules. Each rule has a stable rule ID and structured operands.             |
| Port `role`                     | The function of the port, for example `control` or `byteQualifier`.            |
| Port `presence`                 | `required` or `optional`.                                                      |
| Port `widthPolicy`              | `root`, `derived`, or `fixed`. Refer to section 2.                             |
| Port `derivedWidth`             | The calculation for a derived width. Only derived ports have it.               |
| Port `overrideConstraintRuleId` | The rule ID that checks an override of this port. Refer to section 1.2.        |

The schema is `schemas/bus_definition.schema.json`.

### 1.2 Link from an override to its rule

A derived or fixed port can declare `overrideConstraintRuleId`. This field
gives the exact rule that checks a user override of the port width.

IPCraft uses only this explicit link. It does not search rule IDs, protocol
names, or port names for text to find the rule.

### 1.3 Bus definitions without a contract

A bus definition in a workspace can omit `contract`, `role`, and
`widthPolicy`. IPCraft can still use this bus definition. But IPCraft does not
do conformance checks on it.

All bus definitions that IPCraft ships have a complete version-1 contract.

### 1.4 Alias matching

IPCraft matches aliases with these rules:

1. IPCraft compares a short alias without case sensitivity. Before the
   comparison, it removes spaces, underscores (`_`), periods (`.`), and
   hyphens (`-`). For example, `AVALON_STREAMING`, `avalon-streaming`, and
   `AvalonStreaming` are the same alias.
2. A full VLNV alias must match the vendor, the library, and the name exactly.
3. The version must match exactly. The only exception is an alias that
   declares `version: '*'`. This alias matches all versions.

## 2. Width policies

| Policy    | Who sets the width | Examples                                                                                 |
| --------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `root`    | The user           | AXI `TDATA`, Avalon-ST `data`, memory-mapped address widths                              |
| `derived` | IPCraft calculates | `TKEEP = TDATA / 8`, `WSTRB = WDATA / 8`, Avalon-ST `empty = ceil(log2(symbolsPerBeat))` |
| `fixed`   | The protocol       | Handshake signals (1 bit), AXI `BRESP` (the width in the protocol)                       |

These rules apply to overrides:

- You can override a derived or fixed width. The override is correct only
  when it is equal to the width that the contract gives.
- When you change a root width, the editor removes the overrides of the
  derived widths that depend on it. These overrides are now unnecessary or
  incorrect. The editor does this removal in the same edit as the root
  change.

## 3. Port polarity

### 3.1 Polarity declaration

A port in a bus definition can declare a `polarity` object. The object has
two parts:

- `default`: the assertion level that the port uses when you do not change
  it. The value is `activeHigh` or `activeLow`.
- `roles`: the logical port name for each assertion level.

Example from the Avalon-MM bus definition:

```yaml
- name: read
  polarity:
    default: activeHigh
    roles: { activeHigh: read, activeLow: read_n }
```

The port is still one port, `read`. The polarity selects whether the
generated port is `read` (active-high) or `read_n` (active-low).

### 3.2 Polarity override

To change the polarity of a port, add the canonical port name to
`portPolarityOverrides`:

```yaml
portPolarityOverrides:
  read: activeLow
```

### 3.3 Avalon-MM ports with configurable polarity

In the built-in Avalon-MM contract, only these ports have a configurable
polarity:

- `read`
- `write`
- `byteenable`
- `readdatavalid`
- `waitrequest`

### 3.4 Polarity and port names are independent

`portNameOverrides` sets the physical name of a port. It does not change the
polarity of the port. `portPolarityOverrides` changes the polarity. It does
not change a name that you set with `portNameOverrides`.

## 4. AXI4-Stream byte qualifiers

AXI4-Stream data is aligned to bytes. When you enable `TKEEP` or `TSTRB`, the
port has one bit for each byte of `TDATA`.

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

In this example:

- The `TKEEP: 8` override is correct, because 64 / 8 = 8. But it is not
  necessary, because IPCraft calculates the same value.
- If you change `TDATA` to 32, the `TKEEP` width becomes 4.

## 5. Avalon-ST symbol layout

### 5.1 Width formulas

Avalon-ST has two separate properties: the size of one symbol and the number
of symbols in one beat. IPCraft uses them in these formulas:

```text
data width = dataBitsPerSymbol * symbolsPerBeat
empty width = ceil(log2(symbolsPerBeat))
```

### 5.2 Example: byte symbols

A 32-bit stream with 8-bit symbols has four symbols in each beat. When the
packet ports are enabled, the `empty` port is two bits wide:

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

### 5.3 Example: symbols that are not bytes

A symbol does not have to be 8 bits. Its width also does not have to be a
power of two. A 5-bit stream with 1-bit symbols is correct. Its `empty` port
is three bits wide:

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

### 5.4 Endianness

- For Avalon-ST, `endianness: big` reverses the order of the symbols. It does
  not mean that the symbols are 8 bits wide.
- `firstSymbolInHighOrderBits` is the Platform Designer name for
  `endianness`. IPCraft stores the value in `endianness`. It does not store
  it in `interfaceProperties`.

### 5.5 Default values

- The default value of `readyLatency` is 0.
- If `channel` is enabled and `maxChannel` is not set, IPCraft calculates
  `maxChannel = 2^channelWidth - 1`.

## 6. Interfaces that use parameters

A root width or an interface property can refer to an IP parameter. In this
case, the validator does these checks for each rule:

1. It checks the rule with the default value of each parameter.
2. It finds the parameters that the rule uses. It checks the rule with each
   combination of their `allowedValues`. It does this check only when there
   are 256 combinations or fewer.
3. If there are more than 256 combinations, the validator does not check a
   sample of them. It reports the rule as unresolved with the warning
   `CONFORMANCE_DOMAIN_NOT_EXHAUSTIVE`.

Example:

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

This example has 3 x 3 = 9 combinations. Each combination must obey the
data layout rule (section 5.1). For example, `DATA_WIDTH = 16` with
`SYMBOLS_PER_BEAT = 4` gives 8 x 4 = 32, which is not 16. Thus, the
validator reports an error for this interface.

## 7. Vendor import and export

### 7.1 Platform Designer (`_hw.tcl`)

The `_hw.tcl` importer and exporter map these Avalon-ST properties:

| Platform Designer property   | IPCraft field                           |
| ---------------------------- | --------------------------------------- |
| `dataBitsPerSymbol`          | `interfaceProperties.dataBitsPerSymbol` |
| `symbolsPerBeat`             | `interfaceProperties.symbolsPerBeat`    |
| `readyLatency`               | `interfaceProperties.readyLatency`      |
| `maxChannel`                 | `interfaceProperties.maxChannel`        |
| `firstSymbolInHighOrderBits` | `endianness`                            |

### 7.2 IP-XACT

The IP-XACT exporter writes a copy of the interface properties and the
endianness in the namespace `urn:ipcraft:interface-contract:1`.

When the importer reads a file, it compares this copy with the standard
IP-XACT parameters. If the two do not agree, IPCraft reports a blocking
conflict. It does not select one of the two values.

## 8. Rule IDs of the built-in contracts

| Contract    | Error rules                                                                                                                    | Warning rules               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| AXI4-Lite   | `AXI4L_DATA_WIDTH`, `AXI4L_DATA_EQUAL`, `AXI4L_WSTRB_WIDTH`, `AXI4L_ADDRESS_EQUAL`                                             | None                        |
| AXI4 Full   | `AXI4_DATA_WIDTH`, `AXI4_DATA_EQUAL`, `AXI4_WSTRB_WIDTH`, `AXI4_ID_WIDTHS`, fixed widths, presence dependencies                | None                        |
| AXI4-Stream | `AXIS_DATA_BYTE_ALIGNED`, `AXIS_TKEEP_WIDTH`, `AXIS_TSTRB_WIDTH`, fixed handshake widths                                       | `AXIS_PREFERRED_DATA_WIDTH` |
| Avalon-MM   | `AVALON_MM_DATA_WIDTH`, `AVALON_MM_DATA_EQUAL`, `AVALON_MM_BYTEENABLE_WIDTH`, fixed control widths                             | None                        |
| Avalon-ST   | `AVALON_ST_DATA_LAYOUT`, `AVALON_ST_EMPTY_WIDTH`, `AVALON_ST_PACKET_PORTS`, `AVALON_ST_READY_LATENCY`, `AVALON_ST_MAX_CHANNEL` | None                        |

Each diagnostic contains the YAML path of the problem as an array. The user
interface can show the path as a dotted string, for example
`busInterfaces.0.portWidthOverrides.TKEEP`. This dotted string is only for
display. Do not parse it back into an edit location.
