export type ActivityScopeRecord = {
    major?: string;
    school?: string;
    user?: string[];
  }
  
  export type ActivitySettings = {
    isOpen: boolean;
    isProgressCount: boolean;
    isVisible: boolean;
    scope: ActivityScopeRecord;
  } 