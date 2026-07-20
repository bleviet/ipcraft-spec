# Use the Data Inspector Examples

These recipes save field layouts and operations without saving captured values.
Open one in IPCraft for VS Code, then paste or import a sample.

## Choose a recipe

| Recipe | What it demonstrates |
|---|---|
| `comprehensive_axi_status.ipci.yml` | Imported register fields, enum decoding, and separate raw and decoded overlays |
| `split_address.ipci.yml` | Two 32-bit sources joined into one 64-bit address |

## Try the status recipe

1. Open `comprehensive_axi_status.ipci.yml`.
2. Select the `STATUS` source.
3. Paste a 32-bit status-register value.
4. Review `BUSY`, `FIFO_LEVEL`, and `FSM_STATE`.

The field layout comes from
`examples/comprehensive_axi/comprehensive_axi.mm.yml`.

## Try the split-address recipe

1. Open `split_address.ipci.yml`.
2. Paste `32'h0001_2000` into `ADDR_HI`.
3. Paste `32'h0000_3F00` into `ADDR_LO`.
4. Select the `ADDRESS` operation.

The result is `64'h0001_2000_0000_3F00`. The recipe stores the source widths
and the `concat` operation, but not these sample values.

See [Define a Data Inspector recipe](../../docs/data_inspector_spec.md) for the
complete file structure.
