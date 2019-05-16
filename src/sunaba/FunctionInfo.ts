export default class FunctionInfo {
  mArgCount:        number;
  mHasOutputValue:  boolean;

  constructor() {
    this.mArgCount       = 0;
    this.mHasOutputValue = false;
  }

  public setHasOutputValue() {
    this.mHasOutputValue = true;
  }

  public hasOutputValue(): boolean {
    return this.mHasOutputValue;
  }

  public argCount():number {
    return this.mArgCount;
  }

  public setArgCount(a:number) {
    this.mArgCount = a;
  }
}
