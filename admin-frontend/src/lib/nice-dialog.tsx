import NiceModal, { NiceModalArgs } from "@/contexts/nice-modal-context";
import React from "react";

export const showComponentNiceDialog = <
    T,
    C = any,
    P extends Partial<NiceModalArgs<React.FC<C>>> = Partial<
        NiceModalArgs<React.FC<C>>
    >
>(
    modal: React.FC<C>,
    args?: P
): Promise<{
    result: T;
}> => {
    return NiceModal.show<T, C, P>(modal, args) as Promise<{
        result: T;
        // modal: NiceModalArgs<React.FC<C>>;
    }>;
};