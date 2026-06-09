# comprehensive_axi

Comprehensive AXI-family example. Together with `comprehensive_avalon` it
covers every register-map schema property and every bus-interface feature
supported by the generator.

## Interface coverage

| Feature | Where |
| --- | --- |
| AXI4-Lite slave (primary CSR, drives the bus wrapper) | `S_AXI` |
| AXI4-Full master with width overrides | `M_AXI` |
| Arrayed bus interface (`count`, `indexStart`, naming patterns) | `M_AXIS` (2× AXI-Stream master) |
| Optional bus ports (`useOptionalPorts`) | `M_AXIS` (TLAST/TKEEP/TUSER), `S_AXIS` (TLAST) |
| Conduit interface with user-defined `conduitPorts` (incl. parameterized width and `presence: optional`) | `DBG` |
| Two clock domains, active-low + active-high resets | `i_clk_axi`/`i_clk_proc` |
| Interrupts (LEVEL_HIGH, EDGE_RISING) | `o_irq`, `o_err_pulse` |
| Parameters: integer, natural, positive, boolean, string; parameterized port width | `DATA_W` on `o_gpio` |

## Register-map coverage (`comprehensive_axi.mm.yml`)

| Feature | Where |
| --- | --- |
| All five access types | `ID` (ro), `CMD` (wo), `CTRL` (rw), `IRQ_EVENT` (rw1c + w1c fields) |
| `bits` string and `offset`/`width` field syntax | `CTRL.MODE` vs `CTRL.PRESCALE` |
| Field and register `resetValue` | `ID`, `SCRATCH` |
| `enumeratedValues` | `CTRL.MODE`, `STATUS.FSM_STATE` |
| `monitorChangeOf` (change-of-state W1C) | `IRQ_EVENT.LINK_TOGGLED` watching `LINK_STATE` |
| Flat register array (`count`/`stride`) | `CH_GAIN` (4×) |
| Register group array (nested `registers`) | `DMA` (2× SRC/DST/LEN/CTRL) |
| Explicit and auto-assigned register offsets | `CTRL` (offset 4) vs `STATUS` (auto) |
| `usage: memory` with string `range` | `BUF_RAM` (4K) |
| `usage: reserved` with integer `range` | `RSVD` |

> Note: the generated register file packs registers densely (enumeration
> order × 4 bytes); sparse `baseAddress`/`stride` gaps are preserved in the
> memory-map YAML for documentation/header generation but not in the RTL
> address decoder.

## Validated with

- `npm run test:integration` — fixture generation, plus GHDL
  (analyze/elaborate/`--synth`) and Icarus Verilog (`-g2012`) compile checks
  via `src/test/integration/hdl.test.ts`.
- Vivado `ipx::check_integrity` / Quartus `hw.tcl` suites when those tools
  are installed.
