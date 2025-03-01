// src/utils/debugUtils.ts として新しいファイルを作成
export const getLastActionsForDebug = () => {
    // @ts-ignore
    return window._debugLastActions || {};
  };
  
  export const logState = (label: string, data: any) => {
    console.log(`%c${label}`, 'background: #ffeb3b; color: black; padding: 2px 4px; border-radius: 2px;', data);
  };