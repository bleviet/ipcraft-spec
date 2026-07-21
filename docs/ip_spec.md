<!-- editorconfig-checker-disable-file -->
<!-- YAML examples use two-space indentation. -->

# Define an IP Core

An `*.ip.yml` file describes one FPGA IP core: its identity, ports, interfaces,
parameters, source files, memory maps, and build settings. Only `vlnv` is
required.

## Start with the smallest valid file

```yaml
vlnv:
  vendor: ipcraft
  library: examples
  name: minimal_ip
  version: 1.0.0
```

Use a stable identity because generated projects and other IP cores may refer to
it.

## Understand the top-level sections

| Section | Purpose |
|---|---|
| `vlnv` | Required identity: vendor, library, name, and version |
| `description`, `author` | Human-readable ownership and purpose |
| `parameters` | Values exposed as HDL generics or parameters |
| `clocks`, `resets` | Clock and reset ports |
| `ports`, `interrupts` | Plain HDL ports and interrupt outputs |
| `busInterfaces` | AXI, Avalon, or custom interfaces |
| `memoryMaps` | Inline register maps or an imported `.mm.yml` file |
| `fileSets` | Source, constraint, software, and support files |
| `subcores` | Other IP cores required by this core |
| `simulation` | Testbench framework and simulator overrides |
| `targets` | Intended synthesis tools, such as Vivado or Quartus |
| `useBusLibrary` | Project-local directory containing bus definitions |
| `apiVersion` | Version of the IPCraft file format |
| `scaffold_pack` | Saved scaffold pack selection; normally managed by the editor |

## Set the IP identity

`vlnv` means vendor, library, name, and version.

```yaml
vlnv:
  vendor: my-company.com
  library: peripherals
  name: timer_core
  version: 1.2.0

description: Four-channel timer
author: Hardware Team
```

All four `vlnv` fields are required. Use names that remain valid in generated
HDL and vendor projects.

## Add parameters

Parameters become VHDL generics or Verilog parameters. A port or bus width can
refer to a parameter by name.

```yaml
parameters:
  - name: DATA_WIDTH
    displayName: Data width
    value: 32
    dataType: integer
    min: 8
    max: 128
    description: Width of the data path
```

| Field | Purpose |
|---|---|
| `name` | Required HDL name |
| `value` | Default value |
| `dataType` | `integer`, `natural`, `boolean`, or `string` |
| `displayName` | Friendly label in vendor tools |
| `min`, `max` | Inclusive integer limits |
| `allowedValues` | List of allowed choices; use instead of `min` and `max` |
| `uiPage`, `uiGroup` | Placement in generated configuration screens |
| `description` | Short explanation for users |

If `uiGroup` is set, `uiPage` must also be set.

## Add clocks and resets

Clock and reset associations use the physical `name` fields, not
`logicalName`.

```yaml
clocks:
  - name: i_clk
    logicalName: CLK
    direction: in
    frequency: 100MHz
    associatedReset: i_rst_n

resets:
  - name: i_rst_n
    logicalName: RESET_N
    direction: in
    polarity: activeLow
    associatedClock: i_clk
```

| Field | Clock | Reset |
|---|---|---|
| `name` | Required physical HDL port | Required physical HDL port |
| `logicalName` | Logical name used by packaging tools | Logical name used by packaging tools |
| `direction` | `in`, `out`, or `inout` | `in`, `out`, or `inout` |
| `width` | Integer, parameter, or width expression | Integer, parameter, or width expression |
| `frequency` | Text such as `100MHz` | Not used |
| `polarity` | Not used | `activeHigh` or `activeLow` |
| `associatedReset` | Name of a reset | Not used |
| `associatedClock` | Not used | Name of a clock |

## Add plain ports and interrupts

Use `ports` for signals that are not supplied by a bus definition.

```yaml
ports:
  - name: o_data
    direction: out
    width: DATA_WIDTH
    description: Parallel output

interrupts:
  - name: o_irq
    logicalName: IRQ_OUT
    direction: out
    sensitivity: LEVEL_HIGH
    description: Interrupt request
```

A width can be an integer, a parameter name, or an arithmetic expression such
as `clog2(FIFO_DEPTH)`. Supported functions are `clog2`, `log2`, `ceil`,
`floor`, `abs`, `min`, and `max`.

Interrupt sensitivity can be `LEVEL_HIGH`, `LEVEL_LOW`, `EDGE_RISING`, or
`EDGE_FALLING`.

## Add a bus interface

```yaml
busInterfaces:
  - name: S_AXI
    type: ipcraft:busif:axi4_lite:1.0
    mode: slave
    physicalPrefix: s_axi_
    associatedClock: i_clk
    associatedReset: i_rst_n
    memoryMapRef: CSR
    portWidthOverrides:
      AWADDR: 12
      ARADDR: 12
```

| Field | Purpose |
|---|---|
| `name` | Required interface name |
| `type` | Bus definition identifier |
| `mode` | `master`, `slave`, `source`, `sink`, or `conduit` |
| `physicalPrefix` | Prefix added to generated HDL port names |
| `associatedClock`, `associatedReset` | Physical clock and reset names |
| `memoryMapRef` | Name of the memory map served by the interface |
| `useOptionalPorts` | Optional logical ports to include |
| `portWidthOverrides` | Logical port widths that differ from the bus definition |
| `firstSymbolInHighOrderBits` | Avalon-ST symbol order; `true` places the first symbol in the most-significant data bits |
| `array` | Rules for creating several similar interfaces |
| `conduitPorts` | User-defined signals for a custom conduit |
| `description` | Short explanation of the interface |

### Choose a built-in bus type

| Type | Common modes |
|---|---|
| `ipcraft:busif:axi4_lite:1.0` | `master`, `slave` |
| `ipcraft:busif:axi4_full:1.0` | `master`, `slave` |
| `ipcraft:busif:axi_stream:1.0` | `master`, `slave` |
| `ipcraft:busif:avalon_mm:1.0` | `master`, `slave` |
| `ipcraft:busif:avalon_st:1.0` | `source`, `sink` |

See `bus_definitions/` for logical port names, default widths, directions, and
optional ports.

### Include optional ports

```yaml
useOptionalPorts:
  - TLAST
  - TKEEP
  - TUSER
```

Use the logical names from the bus definition. `portWidthOverrides` uses those
same names and accepts an integer or parameter name.

### Create an interface array

```yaml
busInterfaces:
  - name: M_AXIS
    type: ipcraft:busif:axi_stream:1.0
    mode: master
    array:
      count: 4
      indexStart: 0
      namingPattern: M_AXIS_CH{index}
      physicalPrefixPattern: m_axis_ch{index}_
```

`count`, `namingPattern`, and `physicalPrefixPattern` are required inside
`array`. `indexStart` defaults to zero.

### Define a custom conduit

```yaml
busInterfaces:
  - name: DEBUG
    type: ipcraft:busif:conduit:1.0
    mode: conduit
    physicalPrefix: dbg_
    conduitPorts:
      - name: trace_data
        direction: out
        width: DATA_WIDTH
      - name: trigger
        direction: in
        width: 1
        presence: optional
```

Use `useBusLibrary` when the project keeps reusable custom bus definitions in a
local directory. See `examples/xcvr_loopback/` for a complete example.

## Connect a memory map

Keep a register map in a separate file for most projects:

```yaml
memoryMaps:
  import: timer_core.mm.yml
```

An inline list is also valid:

```yaml
memoryMaps:
  - name: CSR
    addressBlocks:
      - name: REGS
        baseAddress: 0
        range: 4K
        registers: []
```

`memoryMapRef` on a bus interface must match the imported or inline map name.
See [Define a memory map](memory_map_spec.md) for register details.

## List project files

```yaml
fileSets:
  - name: RTL Sources
    files:
      - path: rtl/timer.vhd
        type: vhdl
        version: "2008"
      - path: rtl/timer_core.vhd
        type: vhdl
        managed: false

  - name: Simulation
    files:
      - path: tb/test_timer.py
        type: python
```

| Field | Default | Purpose |
|---|---|---|
| `path` | Required | Path relative to the `.ip.yml` file |
| `type` | Required | File type |
| `managed` | `true` | Whether generation may overwrite an existing file |
| `version` | Tool default | VHDL or Verilog language version |
| `isIncludeFile` | `false` | Marks an include file |
| `logicalName` | Empty | HDL library name |
| `description` | Empty | Human-readable purpose |

When `managed` is `false`, generation creates a missing file once and preserves
it on later runs. IPCraft uses this for user-owned implementation files.

Supported file types are `vhdl`, `verilog`, `systemverilog`, `xdc`, `sdc`,
`ucf`, `cHeader`, `cSource`, `cppHeader`, `cppSource`, `python`, `makefile`,
`pdf`, `markdown`, `text`, `tcl`, `yaml`, `json`, `xml`, and `unknown`.

For VHDL, `version` accepts `87`, `93`, `2002`, `2008`, or `2019`. For
Verilog, it accepts `95` or `2001`. Vivado can preserve the version per file.
Quartus uses a project-wide VHDL setting, so a per-file version does not change
Platform Designer output.

## Add sub-core dependencies

Use a VLNV string when normal discovery is enough:

```yaml
subcores:
  - ipcraft:primitives:fifo_sync:1.0.0
```

Use an object when the dependency has a project-relative path:

```yaml
subcores:
  - vlnv: ipcraft:primitives:fifo_sync:1.0.0
    path: ../fifo_sync
```

## Set simulation options

```yaml
simulation:
  topLevel: timer_test_top
  framework: cocotb
  engine: ghdl
  compileArgs:
    - --std=08
  simArgs:
    - --wave=timer.ghw
  env:
    TEST_MODE: regression

targets:
  - vivado
  - quartus
```

`framework` can be `cocotb` or `vunit`. `engine` can be `ghdl`, `icarus`,
`verilator`, or `questa`. These values override the matching workspace settings
for this IP core.

## Continue with an example

- `templates/minimal.ip.yml` for the smallest file
- `templates/axi_slave.ip.yml` for a register-based AXI4-Lite core
- `templates/avalon_peripheral.ip.yml` for Avalon interfaces
- `examples/comprehensive_axi/` for broad AXI coverage
- `examples/comprehensive_avalon/` for broad Avalon coverage
