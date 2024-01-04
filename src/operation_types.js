const operationTypes = [
  'transfer',
  'limit_order_create',
  'limit_order_cancel',
  'call_order_update',
  'fill_order',
  'account_create',
  'account_update',
  'account_whitelist',
  'account_upgrade',
  'account_transfer',
  'asset_create',
  'asset_update',
  'asset_update_bitasset',
  'asset_update_feed_producers',
  'asset_issue',
  'asset_reserve',
  'asset_fund_fee_pool',
  'asset_settle',
  'asset_global_settle',
  'asset_publish_feed',
  'witness_create',
  'witness_update',
  'proposal_create',
  'proposal_update',
  'proposal_delete',
  'withdraw_permission_create',
  'withdraw_permission_update',
  'withdraw_permission_claim',
  'withdraw_permission_delete',
  'committee_member_create',
  'committee_member_update',
  'committee_member_update_global_parameters',
  'vesting_balance_create',
  'vesting_balance_withdraw',
  'worker_create',
  'custom',
  'assert',
  'balance_claim',
  'override_transfer',
  'transfer_to_blind',
  'blind_transfer',
  'transfer_from_blind',
  'asset_settle_cancel',
  'asset_claim_fees',
  'fba_distribute',
  'bid_collateral',
  'execute_bid',
  'asset_claim_pool',
  'asset_update_issuer', // 48

  // other not implemented xps operations in js
  null,
  null, // 50
  null,
  null,
  null,
  null,
  'lockbalance', // 55
  'foreclose_balance', // 56
  'guard_lock_balance', // 57
  'guard_foreclose_balance', // 58
  'guard_refund_balance', // 59
  'crosschain_record', // 60
  'crosschain_withdraw', // 61
  'crosschain_withdraw_without_sign', // 62
  'crosschain_withdraw_with_sign', // 63
  'crosschain_withdraw_combine_sign', // 64
  'crosschain_withdraw_result', // 65
  'coldhot_transfer', // 66
  'coldhot_transfer_without_sign', // 67
  'coldhot_transfer_with_sign', // 68
  'coldhot_transfer_combine_sign', // 69
  'coldhot_transfer_result', // 70
  'coldhot_cancel_transafer_transaction', // 71
  'coldhot_cancel_uncombined_trx', // 72
  'pay_back', // 73
  'guard_update_multi_account', // 74
  'asset_real_create', // 75

  // xps operations
  'contract_register', // 76
  'contract_upgrade', // 77
  'native_contract_register', // 78
  'contract_invoke', // 79
  'storage', // 80
  'transfer_contract', // 81

  // other operations
  'contract_transfer_fee_proposal',
  'gurantee_create',
  'gurantee_cancel',
  'guard_refund_crosschain_trx',
  'publisher_appointed',
  'asset_fee_modification',
  'bonus',
  'set_guard_lockbalance',
  'publisher_canceled',
  'senator_determine_withdraw_deposit',
  'account_create_multisignature_address',
  'senator_determine_block_payment',
  'eth_seri_guard_sign',
  'eth_series_multi_sol_create',
  'eth_multi_account_create_record',
  'eths_multi_sol_guard_sign',
  'eths_guard_sign_final',
  'asset_eth_create',
  'eths_coldhot_guard_sign_final',
  'referendum_create',
  'citizen_referendum_senator',
  'referendum_update',
  'referendum_accelerate_pledge',
  'block_address',
  'cancel_address_block',
  'eth_cancel_fail_crosschain_trx',
  'eth_cancel_coldhot_fail_trx_operaion',
  'eths_guard_change_signer',
  'eths_guard_coldhot_change_signer',
  'coldhot_cancel_combined_trx_operaion',
  'guard_cancel_combine_trx',
  'senator_pass_success_trx',
  'coldhot_pass_combine_trx',
]

export default {
  types: operationTypes,
}
