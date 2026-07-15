const path = require('path');

const root = __dirname;

module.exports = {
  schemas: {
    ipCore: path.join(root, 'schemas', 'ip_core.schema.json'),
    memoryMap: path.join(root, 'schemas', 'memory_map.schema.json')
  },
  busDefinitions: {
    axi4_full: path.join(root, 'bus_definitions', 'axi4_full.yml'),
    axi4_lite: path.join(root, 'bus_definitions', 'axi4_lite.yml'),
    axi_stream: path.join(root, 'bus_definitions', 'axi_stream.yml'),
    avalon_mm: path.join(root, 'bus_definitions', 'avalon_mm.yml'),
    avalon_st: path.join(root, 'bus_definitions', 'avalon_st.yml')
  },
  templates: path.join(root, 'templates')
};
