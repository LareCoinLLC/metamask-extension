/*

This migration removes transactions that are no longer usefull down to 40 total

*/

import { cloneDeep } from 'lodash';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';

const version = 23;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data;
      const newState = transformState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`Larecoin Migration #${version}${err.stack}`);
    }
    return Promise.resolve(versionedData);
  },
};

function transformState(state) {
  const newState = state;

  const { TransactionController } = newState;
  if (TransactionController && TransactionController.transactions) {
    const { transactions } = newState.TransactionController;

    if (transactions.length <= 40) {
      return newState;
    }

    const reverseTxList = transactions.reverse();
    let stripping = true;
    while (reverseTxList.length > 40 && stripping) {
      const txIndex = reverseTxList.findIndex((txMeta) => {
        return (
          txMeta.status === TRANSACTION_STATUSES.FAILED ||
          txMeta.status === TRANSACTION_STATUSES.REJECTED ||
          txMeta.status === TRANSACTION_STATUSES.CONFIRMED ||
          txMeta.status === TRANSACTION_STATUSES.DROPPED
        );
      });
      if (txIndex < 0) {
        stripping = false;
      } else {
        reverseTxList.splice(txIndex, 1);
      }
    }

    newState.TransactionController.transactions = reverseTxList.reverse();
  }
  return newState;
}
