export interface NavigationItem { to: string; label: string; icon: string; end: boolean; }
export const NAVIGATION: Array<{title: string; items: NavigationItem[]}> = [
  {title:"Operación",items:[
    {to:"/",label:"Resumen",icon:"home",end:true},
    {to:"/evaluar",label:"Evaluar riego",icon:"gauge",end:false},
    {to:"/riegos",label:"Historial de riego",icon:"drop",end:false},
  ]},
  {title:"Monitoreo",items:[
    {to:"/alertas",label:"Alertas",icon:"bell",end:false},
    {to:"/sensores",label:"Sensores",icon:"sensor",end:false},
    {to:"/clima",label:"Clima",icon:"cloud",end:false},
  ]},
  {title:"Gestión de campo",items:[
    {to:"/parcelas",label:"Parcelas",icon:"map",end:false},
    {to:"/agricultores",label:"Agricultores",icon:"users",end:false},
  ]},
  {title:"Referencia y pruebas",items:[
    {to:"/catalogos",label:"Cultivos y suelos",icon:"layers",end:false},
    {to:"/validacion",label:"Validación",icon:"flask",end:false},
  ]},
];
export const ROUTE_TITLES = Object.fromEntries(NAVIGATION.flatMap(g=>g.items.map(i=>[i.to,i.label])));
export const FARMER_NAVIGATION: NavigationItem[] = [
  {to:"/",label:"Hoy",icon:"home",end:true},
  {to:"/evaluar",label:"Evaluar",icon:"gauge",end:false},
  {to:"/riegos",label:"Mis riegos",icon:"drop",end:false},
  {to:"/alertas",label:"Alertas",icon:"bell",end:false},
];
