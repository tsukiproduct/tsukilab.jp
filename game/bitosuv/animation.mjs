// Distance-driven gait. Front/back keep asymmetric outfit details on the same side.
export function heroPose(p){
 const direction=p.direction||0;
 if(direction===1||direction===2)return {kind:'motion',col:p.moving?Math.floor(p.walk/36)%2:0,flip:direction===2?-1:1};
 if(direction===3)return {kind:'motion',col:2+(p.moving?Math.floor(p.walk/36)%2:0),flip:1};
 return {kind:'hero',col:p.moving?[0,1,0,2][Math.floor(p.walk/24)%4]:0,flip:1};
}
