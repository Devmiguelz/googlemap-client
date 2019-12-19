
export class Usuario {

    public id: string;
    public nombre: string;
    public codsala: number;

    constructor( nombre: string , codsala: number, id?: string ) {

        this.id = id;
        this.nombre = nombre;
        this.codsala   = codsala;

    }

}