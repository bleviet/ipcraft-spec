# comprehensive_avalon

Comprehensive Avalon-family example. Together with `comprehensive_axi` it
covers every register-map schema property and every bus-interface feature
supported by the generator.

## Interface coverage

| Feature | Where |
| --- | --- |
| Avalon-MM slave (primary CSR, drives the `avmm` bus wrapper) | `S_AVMM` |
| Optional Avalon-MM ports (byteenable, waitrequest, readdatavalid) | `S_AVMM` |
| Avalon-ST `source` mode with packet/sideband ports (sop/eop/empty/channel/error/ready) | `SRC_ST` |
| Avalon-ST `sink` mode with `portNameOverrides` (renamed physical ports) | `SNK_ST` |
| Parameter-driven stream width | `ST_DATA_W` on `SRC_ST.data` |
| Interrupts (LEVEL_LOW, EDGE_FALLING) | `o_irq_n`, `o_evt_fall` |
| Single clock, active-high reset | `clk`/`rst` |

## Register-map coverage (`comprehensive_avalon.mm.yml`)

- All access types: `VERSION` (ro), `CONTROL` (rw with wo strobe field),
  `EVENTS` (read-write-1-to-clear with w1c fields), `SAMPLE_CNT` (ro array).
- `monitorChangeOf` change-of-state automation through the **Avalon-MM**
  wrapper (`EVENTS.SRC_TOGGLED` watching `SRC_ACTIVE`).
- `enumeratedValues` (`CONTROL.LOG_LEVEL`).
- Flat register array (`SAMPLE_CNT`, count 2 / stride 4).
- `usage: memory` block (`MAILBOX`, range 1K).

## Validated with

- `npm run test:integration` — fixture generation, plus GHDL
  (analyze/elaborate/`--synth`) and Icarus Verilog (`-g2012`) compile checks
  via `src/test/integration/hdl.test.ts`.
- Vivado `ipx::check_integrity` / Quartus `hw.tcl` suites when those tools
  are installed.
