import { atom } from "jotai";
import { AccountTypeEnum } from "@/shared/enums";

export enum OverviewAccountType {
    PROPFIRM = 'propfirm',
    OWNBROKER = 'ownbroker',
}

export const overviewAccountTypeAtom = atom<OverviewAccountType>(
    OverviewAccountType.PROPFIRM
);

export const overviewSelectedTabAtom = atom<AccountTypeEnum>(
    AccountTypeEnum.EVALUATION
)