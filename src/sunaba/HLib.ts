export default class HLib {
    public static assert(f:boolean, mesg:string = '') {
        if (f === false){
            throw 'BUG #1 ' + mesg;
         }      
    }
}