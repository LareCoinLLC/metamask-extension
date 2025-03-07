/*

This migration sets transactions with the 'Gave up submitting tx.' err message
to a 'failed' stated

*/

import { cloneDeep } from 'lodash';
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';

const version = 15;

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
    const { transactions } = TransactionController;
    newState.TransactionController.transactions = transactions.map((txMeta) => {
      if (!txMeta.err) {
        return txMeta;
      } else if (txMeta.err.message === 'Gave up submitting tx.') {
        txMeta.status = TRANSACTION_STATUSES.FAILED;
      }
      return txMeta;
    });
  }
  return newState;
}
