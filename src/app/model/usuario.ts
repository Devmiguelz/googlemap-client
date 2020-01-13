
export class Usuario {

    public id: string;
    public nombre: string;
    public codruta: number;

    constructor( nombre: string , codruta: number, id?: string ) {

        this.id = id;
        this.nombre = nombre;
        this.codruta = codruta;

    }

}