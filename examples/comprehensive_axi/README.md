# Explore the Comprehensive AXI Example

This example shows a large IP core with several AXI interfaces and a detailed
memory map. Use it as a reference for advanced schema fields, not as the
smallest starting point for a new core.

## Open the files

| File | Contents |
|---|---|
| `comprehensive_axi.ip.yml` | IP identity, parameters, ports, interfaces, and build targets |
| `comprehensive_axi.mm.yml` | Control registers, arrays, grouped registers, memory, and reserved space |

Open `comprehensive_axi.ip.yml` with IPCraft for VS Code. Its `memoryMaps`
section imports the memory map from the same directory.

## Review the interfaces

| Interface | What it demonstrates |
|---|---|
| `S_AXI` | AXI4-Lite register slave with address-width overrides |
| `M_AXI` | AXI4-Full master with optional burst and ID signals |
| `M_AXIS` | Two AXI4-Stream masters created from one interface array |
| `S_AXIS` | AXI4-Stream slave with optional sideband signals |
| `DBG` | Custom conduit with required and optional user-defined ports |

The example also contains two clock domains, active-high and active-low resets,
level and edge interrupts, and parameter-based port widths.

## Review the memory map

| Feature | Location |
|---|---|
| Read-only, write-only, and read-write registers | `ID`, `CMD`, `CTRL`, `SCRATCH` |
| Write-one-to-clear fields | `IRQ_EVENT` |
| Read-write self-clearing field | `CTRL.SOFT_RST` |
| Field range and offset/width syntax | `CTRL.MODE`, `CTRL.PRESCALE` |
| Register and field reset values | `ID`, `SCRATCH`, `CTRL` |
| Enumerated values | `CTRL.MODE`, `STATUS.FSM_STATE` |
| Automatic change detection | `IRQ_EVENT.LINK_TOGGLED` |
| Flat register array | `CH_GAIN` |
| Array of register groups | `DMA` |
| Memory and reserved blocks | `BUF_RAM`, `RSVD` |

The generated register file currently packs implemented registers in their
listed order. Explicit gaps remain useful for documentation and software
headers, but are not represented as sparse locations in the RTL address
decoder.

## Validate the example

From the IPCraft for VS Code repository root, run:

```bash
npm run test:integration:hdl
```

This regenerates the fixture and checks the generated VHDL and SystemVerilog
with the available open-source compilers. Use `npm run test:integration:vivado`
or `npm run test:integration:quartus` when those vendor tools are installed.
