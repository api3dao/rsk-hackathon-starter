const util = require('./util');

module.exports = {
  providerId:
    util.readFromReceipt('providerId') || '0x189989906bd5b4076005549386731dbcb69329d7b7ae4de32707a441a936ad78',
  endpointId: '0xf466b8feec41e9e50815e0c9dca4db1ff959637e564bb13fefa99e9f9f90453c',
};
