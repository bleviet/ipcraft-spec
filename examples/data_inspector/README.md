# Data Inspector examples

These recipes contain reusable decode layouts and transform definitions only.
They intentionally contain no captured values: paste or import samples into the
Data Inspector after opening a recipe.

| Recipe | Demonstrates |
| --- | --- |
| `comprehensive_axi_status.ipci.yml` | Register-layout fields, enum decoding, raw and decoded overlay groups, and provenance from the comprehensive AXI register map. |
| `split_address.ipci.yml` | Two independent 32-bit sources composed into one 64-bit address with an explicit high-word then low-word `concat` step. |

For the split-address example, paste `32'h0001_2000` into `ADDR_HI` and
`32'h0000_3F00` into `ADDR_LO`, then select the `address` transform step on
the canvas. Its composed value is `64'h0001_2000_0000_3F00`.
