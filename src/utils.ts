// function ctiEncode(
//   txn_hash: string /* hex string */,
//   txn_index: number,
//   ledger_hash: string /* hex string */,
//   ledger_index: number
// ) {
//   const ledgerCheck = BigInt(Number.parseInt(ledger_hash.slice(0, 1), 16));
//   const txnCheck = BigInt(Number.parseInt(txn_hash.slice(0, 1), 16));
//   let cti = (ledgerCheck << 4n) + txnCheck;
//   cti <<= 16n;
//   cti += BigInt(txn_index);
//   cti <<= 32n;
//   cti += BigInt(ledger_index);
//   return cti;
// }

// function ctiIsSimple(cti: any) {
//   return cti >> 56n == 0;
// }

// function cti_transaction_index(cti) {
//   return (cti >> 32n) & 0xffffn;
// }

// function cti_ledger_index(cti) {
//   return cti & 0xffffffffn;
// }

// function cti_ledgerCheck(cti) {
//   return (cti >> 52n) & 0xfn;
// }

// function cti_transaction_check(cti) {
//   return (cti >> 48n) & 0xfn;
// }
