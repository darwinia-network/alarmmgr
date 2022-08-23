use substorager::{StorageHasher, StorageKey};

#[test]
fn test_gen_storage_key_plain() {
  let builder = StorageKey::builder("DarwiniaEthereumRelay", "BestConfirmedBlockNumber");
  let storage_key = builder.build();
  let hex = array_bytes::bytes2hex("0x", &storage_key.0);
  assert_eq!(
    hex,
    "0x1eba91727123006726fcc29a6783a88fc1410f2a4c504618e2108ed47fefc873",
  );
}

#[test]
fn test_gen_storage_key_map() {
  let mut builder = StorageKey::builder("DarwiniaEthereumRelay", "DagsMerkleRoots");
  builder.param(StorageHasher::Identity, &1212u64);
  let storage_key = builder.build();
  let hex = array_bytes::bytes2hex("0x", &storage_key.0);
  assert_eq!(
    hex,
    "0x1eba91727123006726fcc29a6783a88f2b529812decd5a023a3d1a896c734e41bc04000000000000",
  );
}
