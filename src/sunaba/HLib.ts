export default class HLib {
    public static assert(f:boolean) {
        if (f === false){
            throw 'BUG';
         }      
    }
}