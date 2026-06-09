<!-- editorconfig-checker-disable-file -->
<!-- This file contains YAML examples with 2-space indentation per YAML standard -->

# Memory Map Specification

This document defines the YAML format for IPCraft memory map definitions (`*.mm.yml`).

## File Conventions

| Extension | Purpose | Detection |
|-----------|---------|-----------|
| `*.mm.yml` | Memory Map definition | Register/address block definitions |

---

## Memory Map Structure

A memory map file contains a list of one or more memory map objects.

```yaml
- name: CSR_MAP
  description: Control and status registers
  addressBlocks:
    - name: REGS
      baseAddress: 0
      range: 4096
      usage: register           # register | memory | reserved
      defaultRegWidth: 32
      registers:
        - name: CTRL
          offset: 0
          size: 32
          access: read-write
          resetValue: 0x00000000
          description: Control register
          fields:
            - name: ENABLE
              bits: "[0:0]"
              access: read-write
              description: Enable bit
              enumeratedValues:
                0: DISABLED
                1: ENABLED

            - name: MODE
              bits: "[2:1]"
              access: read-write

        - name: STATUS
          offset: 4
          access: read-only
          fields:
            - name: BUSY
              bits: "[0:0]"

        - name: IRQ_FLAGS
          offset: 8
          access: write-1-to-clear
```

---

## Address Blocks

Address blocks are contiguous regions within a memory map.

| Property | Description |
|----------|-------------|
| `name` | Block identifier |
| `baseAddress` | Starting address of the block |
| `range` | Size in bytes (e.g., 4096, '4K', '1M') |
| `usage` | `register` (default), `memory`, or `reserved` |
| `access` | Default access for the block |
| `defaultRegWidth` | Default width for registers (usually 32) |

---

## Registers

| Property | Description |
|----------|-------------|
| `name` | Register identifier |
| `offset` | Byte offset from the block base address |
| `size` | Width in bits (default: 32) |
| `access` | Access type (see below) |
| `resetValue` | Value after hardware reset |
| `description` | Human-readable description |
| `fields` | List of bit fields (optional) |
| `registers` | List of child registers (for grouping) |

### Register Arrays

Registers can be replicated using `count` and `stride`.

```yaml
registers:
  - name: TIMER
    count: 4
    stride: 16               # Bytes between array elements
    registers:
      - name: CTRL
        offset: 0
      - name: STATUS
        offset: 4
      - name: COMPARE
        offset: 8
```

This expands to: `TIMER_0_CTRL`, `TIMER_0_STATUS`, `TIMER_1_CTRL`, etc.

### Register Groups

Registers can contain child registers to create logical groups or nested structures.

```yaml
registers:
  - name: CHANNEL_CONFIG
    registers:
      - name: ADDR
        offset: 0
      - name: SIZE
        offset: 4
```

---

## Bit Fields

| Property | Description |
|----------|-------------|
| `name` | Field identifier |
| `bits` | Bit range string, e.g., `"[7:0]"` or `"[0:0]"` |
| `access` | Access type |
| `resetValue` | Field-specific reset value |
| `description` | Human-readable description |
| `enumeratedValues` | Map of integer values to symbolic names |
| `monitorChangeOf` | Field name in same register to watch for change-of-state (see below) |

---

## Access Types

| Type | Description |
|------|-------------|
| `read-write` | Normal read/write register |
| `read-only` | Read-only (status, version) |
| `write-only` | Write-only (command) |
| `write-1-to-clear` | Writing 1 clears bits (interrupt flags) |
| `read-write-1-to-clear` | Read-write with write-1-to-clear behavior |

### Change-of-State W1C (`monitorChangeOf`)

A `write-1-to-clear` field can carry `monitorChangeOf: FIELD_NAME` to reference another field
in the same register. When present:

- **No external pulse port** is generated for the monitoring field in `t_regs_hw2sw`.
- The generator creates an internal shadow register for the monitored field's value.
- A combinatorial comparator detects when the live value differs from the shadow.
- The change-of-state pulse drives the W1C sticky bit automatically.
- The monitored field's live value is exposed via a `_val` port in `t_regs_hw2sw`.

**Constraints:** `monitorChangeOf` is only valid on `write-1-to-clear` or `read-write-1-to-clear`
fields. The referenced field must exist in the same register.

**Example:**

```yaml
- name: SENSOR_STATUS
  offset: 0x40
  access: read-write-1-to-clear
  description: Sensor status with automatic change detection
  fields:
    - name: FIFO_OVERFLOW
      bits: "[0:0]"
      access: write-1-to-clear
      description: Sticky bit — set by external FIFO overflow pulse.

    - name: TEMP_VALUE
      bits: "[15:4]"
      access: read-only
      description: Live 12-bit ADC temperature reading.

    - name: TEMP_UPDATED
      bits: "[16:16]"
      access: write-1-to-clear
      monitorChangeOf: TEMP_VALUE
      description: Sticky bit — auto-sets when TEMP_VALUE changes. No pulse port needed.
```

Generated interface (VHDL):

```vhdl
-- t_regs_hw2sw contains:
--   sensor_status_pulse : t_reg_sensor_status_pulse  -- fifo_overflow_pulse only
--   sensor_status_val   : t_reg_sensor_status_val    -- temp_value (live, for CoS monitoring)
-- Internal to register file:
--   shadow register + comparator → drives temp_updated sticky bit automatically
```

---

## Templates

| Template | Use Case |
|----------|----------|
| `minimal.mm.yml` | Bare minimum memory map |
| `basic.mm.yml` | Simple memory map |
| `axi_slave.mm.yml` | AXI-Lite slave registers |
| `array.mm.yml` | Register arrays with count/stride |
| `multi_block.mm.yml` | Multiple address blocks |

---

## Examples

Reference examples in `examples/`:

- `basic_peripheral/basic_peripheral.mm.yml`
- `multi_interface_accelerator/accelerator.mm.yml`
