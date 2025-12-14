export function isMasterAccount(
    accountId: number,
    copierAccounts?: any
  ): boolean {
    if (!copierAccounts?.copier_accounts) {
      return false;
    }
  
    return copierAccounts.copier_accounts.some(
      (account: any) => account.master_account === accountId
    );
  }
  
  export function isCopierAccount(
    accountId: number,
    copierAccounts?: any
  ): boolean {
    if (!copierAccounts?.copier_accounts) {
      return false;
    }
  
    return copierAccounts.copier_accounts.some(
      (account: any) => account.copier_accounts?.some(
        (copier: any) => copier.copy_account === accountId
      )
    );
  }
  
  export function getAccountRole(
    accountId: number,
    copierAccounts?: any
  ): 'master' | 'copier' | 'none' {
    if (isMasterAccount(accountId, copierAccounts)) {
      return 'master';
    }
    if (isCopierAccount(accountId, copierAccounts)) {
      return 'copier';
    }
    return 'none';
  }
  
  export function organizeAccountsIntoTree<T extends { id: number }>(
    accounts: T[],
    copierAccounts?: any
  ): Array<{ master: T; slaves: T[] }> {
    if (!copierAccounts?.copier_accounts || !accounts.length) {
      return accounts.map(account => ({ master: account, slaves: [] }));
    }
  
    const accountsMap = new Map(accounts.map(account => [account.id, account]));
    const processedSlaves = new Set<number>();
    const treeNodes: Array<{ master: T; slaves: T[] }> = [];
  
    // Process master accounts
    accounts.forEach(account => {
      if (isMasterAccount(account.id, copierAccounts) && !processedSlaves.has(account.id)) {
        const slaveIds = getSlaveAccounts(account.id, copierAccounts);
        const slaves = slaveIds
          .map(id => accountsMap.get(id))
          .filter(slave => slave !== undefined) as T[];
  
        slaves.forEach(slave => processedSlaves.add(slave.id));
  
        treeNodes.push({
          master: account,
          slaves: slaves,
        });
      }
    });
  
    // Process standalone accounts (not masters, not slaves)
    const standaloneAccounts = accounts.filter(account =>
      !isMasterAccount(account.id, copierAccounts) &&
      !processedSlaves.has(account.id) &&
      getAccountRole(account.id, copierAccounts) === 'none'
    );
  
    standaloneAccounts.forEach(account => {
      treeNodes.push({
        master: account,
        slaves: [],
      });
    });
  
    return treeNodes;
  }
  
  function getSlaveAccounts(
    masterAccountId: number,
    copierAccounts?: any
  ): number[] {
    if (!copierAccounts?.copier_accounts) {
      return [];
    }
  
    const slaveIds: number[] = [];
    
    copierAccounts.copier_accounts.forEach((account: any) => {
      if (account.master_account === masterAccountId) {
        account.copier_accounts?.forEach((copier: any) => {
          slaveIds.push(copier.copy_account);
        });
      }
    });
  
    return slaveIds;
  }