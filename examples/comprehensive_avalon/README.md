# Explore the Comprehensive Avalon Example

This example shows an Avalon-MM register slave, Avalon-ST interfaces, and a
memory map with sticky event fields. Use it when building a Quartus-oriented IP
core or comparing Avalon behavior with the comprehensive AXI example.

## Open the files

| File | Contents |
|---|---|
| `comprehensive_avalon.ip.yml` | IP identity, ports, Avalon interfaces, and build targets |
| `comprehensive_avalon.mm.yml` | Registers, events, an array, and a memory block |

Open `comprehensive_avalon.ip.yml` with IPCraft for VS Code. Its `memoryMaps`
section imports the memory map from the same directory.

## Review the interfaces

| Interface | What it demonstrates |
|---|---|
| `S_AVMM` | Avalon-MM register slave with optional flow-control signals |
| `SRC_ST` | Avalon-ST source with packet and sideband signals |
| `SNK_ST` | Avalon-ST sink with renamed physical ports |

The example also shows a parameter-based stream width, an active-high reset,
level-low and falling-edge interrupts, and a plain synchronization input.

## Review the memory map

| Feature | Location |
|---|---|
| Read-only and read-write registers | `VERSION`, `CONTROL` |
| Write self-clearing field | `CONTROL.CLEAR_STATS` |
| Write-one-to-clear event fields | `EVENTS.OVERRUN`, `EVENTS.UNDERRUN` |
| Automatic change detection | `EVENTS.SRC_TOGGLED` |
| Enumerated values | `CONTROL.LOG_LEVEL` |
| Flat register array | `SAMPLE_CNT` |
| Memory block | `MAILBOX` |

`EVENTS.SRC_TOGGLED` watches `SRC_ACTIVE`. The generated register logic sets the
sticky flag whenever the live source state changes.

## Validate the example

From the IPCraft for VS Code repository root, run:

```bash
npm run test:integration:hdl
```

This regenerates the fixture and checks the generated VHDL and SystemVerilog
with the available open-source compilers. Use `npm run test:integration:vivado`
or `npm run test:integration:quartus` when those vendor tools are installed.
