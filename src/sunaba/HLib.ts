export default class HLib {
  public static assert(f:boolean, mesg:string = '') {
    if (f === false) {
      throw new Error(`BUG ${mesg}`);
    }
  }
}
