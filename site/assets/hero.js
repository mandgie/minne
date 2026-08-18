var j$="180";var y$=0,C7=1,v$=2;var w7=1,f$=2,i0=3,W9=0,T0=1,o0=2,D8=0,C9=1,K9=2,P7=3,A7=4,b$=5,Y9=100,h$=101,x$=102,g$=103,p$=104,m$=200,d$=201,l$=202,u$=203,c$=204,n$=205,s$=206,i$=207,o$=208,a$=209,r$=210,t$=211,e$=212,JZ=213,QZ=214,F6=0,M6=1,k6=2,w9=3,V6=4,L6=5,z6=6,B6=7,$Z=0,ZZ=1,WZ=2,K8=0,KZ=1,YZ=2,HZ=3,XZ=4,UZ=5,GZ=6,EZ=7;var H9=301,P8=302,I6=303,_6=304,P9=306,NZ=1000,qZ=1001,DZ=1002,X9=1003,OZ=1004;var A9=1005;var A8=1006,C6=1007;var U9=1008;var O8=1009,RZ=1010,FZ=1011,T9=1012,T7=1013,G9=1014,R8=1015,S9=1016,S7=1017,j7=1018,E9=1020,MZ=35902,kZ=35899,VZ=1021,LZ=1022,a0=1023,w6=1026,j9=1027,zZ=1028,y7=1029,BZ=1030,v7=1031;var f7=1033,P6=33776,A6=33777,T6=33778,S6=33779,b7=35840,h7=35841,x7=35842,g7=35843,p7=36196,m7=37492,d7=37496,l7=37808,u7=37809,c7=37810,n7=37811,s7=37812,i7=37813,o7=37814,a7=37815,r7=37816,t7=37817,e7=37818,JQ=37819,QQ=37820,$Q=37821,ZQ=36492,WQ=36494,KQ=36495,YQ=36283,HQ=36284,XQ=36285,UQ=36286;var IZ=3201;var _Z=0,CZ=1,T8="",wZ="srgb",y9="srgb-linear",GQ="linear",rJ="srgb";var PZ=512,AZ=513,TZ=514,EQ=515,SZ=516,jZ=517,yZ=518,vZ=519;var S8=35048;var NQ="300 es",qQ=2000;class F8{addEventListener(J,Q){if(this._listeners===void 0)this._listeners={};let $=this._listeners;if($[J]===void 0)$[J]=[];if($[J].indexOf(Q)===-1)$[J].push(Q)}hasEventListener(J,Q){let $=this._listeners;if($===void 0)return!1;return $[J]!==void 0&&$[J].indexOf(Q)!==-1}removeEventListener(J,Q){let $=this._listeners;if($===void 0)return;let Z=$[J];if(Z!==void 0){let W=Z.indexOf(Q);if(W!==-1)Z.splice(W,1)}}dispatchEvent(J){let Q=this._listeners;if(Q===void 0)return;let $=Q[J.type];if($!==void 0){J.target=this;let Z=$.slice(0);for(let W=0,K=Z.length;W<K;W++)Z[W].call(this,J);J.target=null}}}var R0=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Q7=Math.PI/180,D6=180/Math.PI;function v9(){let J=Math.random()*4294967295|0,Q=Math.random()*4294967295|0,$=Math.random()*4294967295|0,Z=Math.random()*4294967295|0;return(R0[J&255]+R0[J>>8&255]+R0[J>>16&255]+R0[J>>24&255]+"-"+R0[Q&255]+R0[Q>>8&255]+"-"+R0[Q>>16&15|64]+R0[Q>>24&255]+"-"+R0[$&63|128]+R0[$>>8&255]+"-"+R0[$>>16&255]+R0[$>>24&255]+R0[Z&255]+R0[Z>>8&255]+R0[Z>>16&255]+R0[Z>>24&255]).toLowerCase()}function gJ(J,Q,$){return Math.max(Q,Math.min($,J))}function bW(J,Q){return(J%Q+Q)%Q}function $7(J,Q,$){return(1-$)*J+$*Q}function k9(J,Q){switch(Q.constructor){case Float32Array:return J;case Uint32Array:return J/4294967295;case Uint16Array:return J/65535;case Uint8Array:return J/255;case Int32Array:return Math.max(J/2147483647,-1);case Int16Array:return Math.max(J/32767,-1);case Int8Array:return Math.max(J/127,-1);default:throw new Error("Invalid component type.")}}function I0(J,Q){switch(Q.constructor){case Float32Array:return J;case Uint32Array:return Math.round(J*4294967295);case Uint16Array:return Math.round(J*65535);case Uint8Array:return Math.round(J*255);case Int32Array:return Math.round(J*2147483647);case Int16Array:return Math.round(J*32767);case Int8Array:return Math.round(J*127);default:throw new Error("Invalid component type.")}}class cJ{constructor(J=0,Q=0){cJ.prototype.isVector2=!0,this.x=J,this.y=Q}get width(){return this.x}set width(J){this.x=J}get height(){return this.y}set height(J){this.y=J}set(J,Q){return this.x=J,this.y=Q,this}setScalar(J){return this.x=J,this.y=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setComponent(J,Q){switch(J){case 0:this.x=Q;break;case 1:this.y=Q;break;default:throw new Error("index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y)}copy(J){return this.x=J.x,this.y=J.y,this}add(J){return this.x+=J.x,this.y+=J.y,this}addScalar(J){return this.x+=J,this.y+=J,this}addVectors(J,Q){return this.x=J.x+Q.x,this.y=J.y+Q.y,this}addScaledVector(J,Q){return this.x+=J.x*Q,this.y+=J.y*Q,this}sub(J){return this.x-=J.x,this.y-=J.y,this}subScalar(J){return this.x-=J,this.y-=J,this}subVectors(J,Q){return this.x=J.x-Q.x,this.y=J.y-Q.y,this}multiply(J){return this.x*=J.x,this.y*=J.y,this}multiplyScalar(J){return this.x*=J,this.y*=J,this}divide(J){return this.x/=J.x,this.y/=J.y,this}divideScalar(J){return this.multiplyScalar(1/J)}applyMatrix3(J){let Q=this.x,$=this.y,Z=J.elements;return this.x=Z[0]*Q+Z[3]*$+Z[6],this.y=Z[1]*Q+Z[4]*$+Z[7],this}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this}clamp(J,Q){return this.x=gJ(this.x,J.x,Q.x),this.y=gJ(this.y,J.y,Q.y),this}clampScalar(J,Q){return this.x=gJ(this.x,J,Q),this.y=gJ(this.y,J,Q),this}clampLength(J,Q){let $=this.length();return this.divideScalar($||1).multiplyScalar(gJ($,J,Q))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(J){return this.x*J.x+this.y*J.y}cross(J){return this.x*J.y-this.y*J.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(J){let Q=Math.sqrt(this.lengthSq()*J.lengthSq());if(Q===0)return Math.PI/2;let $=this.dot(J)/Q;return Math.acos(gJ($,-1,1))}distanceTo(J){return Math.sqrt(this.distanceToSquared(J))}distanceToSquared(J){let Q=this.x-J.x,$=this.y-J.y;return Q*Q+$*$}manhattanDistanceTo(J){return Math.abs(this.x-J.x)+Math.abs(this.y-J.y)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,Q){return this.x+=(J.x-this.x)*Q,this.y+=(J.y-this.y)*Q,this}lerpVectors(J,Q,$){return this.x=J.x+(Q.x-J.x)*$,this.y=J.y+(Q.y-J.y)*$,this}equals(J){return J.x===this.x&&J.y===this.y}fromArray(J,Q=0){return this.x=J[Q],this.y=J[Q+1],this}toArray(J=[],Q=0){return J[Q]=this.x,J[Q+1]=this.y,J}fromBufferAttribute(J,Q){return this.x=J.getX(Q),this.y=J.getY(Q),this}rotateAround(J,Q){let $=Math.cos(Q),Z=Math.sin(Q),W=this.x-J.x,K=this.y-J.y;return this.x=W*$-K*Z+J.x,this.y=W*Z+K*$+J.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class M8{constructor(J=0,Q=0,$=0,Z=1){this.isQuaternion=!0,this._x=J,this._y=Q,this._z=$,this._w=Z}static slerpFlat(J,Q,$,Z,W,K,H){let Y=$[Z+0],X=$[Z+1],U=$[Z+2],E=$[Z+3],G=W[K+0],N=W[K+1],O=W[K+2],M=W[K+3];if(H===0){J[Q+0]=Y,J[Q+1]=X,J[Q+2]=U,J[Q+3]=E;return}if(H===1){J[Q+0]=G,J[Q+1]=N,J[Q+2]=O,J[Q+3]=M;return}if(E!==M||Y!==G||X!==N||U!==O){let k=1-H,q=Y*G+X*N+U*O+E*M,D=q>=0?1:-1,P=1-q*q;if(P>Number.EPSILON){let I=Math.sqrt(P),S=Math.atan2(I,q*D);k=Math.sin(k*S)/I,H=Math.sin(H*S)/I}let V=H*D;if(Y=Y*k+G*V,X=X*k+N*V,U=U*k+O*V,E=E*k+M*V,k===1-H){let I=1/Math.sqrt(Y*Y+X*X+U*U+E*E);Y*=I,X*=I,U*=I,E*=I}}J[Q]=Y,J[Q+1]=X,J[Q+2]=U,J[Q+3]=E}static multiplyQuaternionsFlat(J,Q,$,Z,W,K){let H=$[Z],Y=$[Z+1],X=$[Z+2],U=$[Z+3],E=W[K],G=W[K+1],N=W[K+2],O=W[K+3];return J[Q]=H*O+U*E+Y*N-X*G,J[Q+1]=Y*O+U*G+X*E-H*N,J[Q+2]=X*O+U*N+H*G-Y*E,J[Q+3]=U*O-H*E-Y*G-X*N,J}get x(){return this._x}set x(J){this._x=J,this._onChangeCallback()}get y(){return this._y}set y(J){this._y=J,this._onChangeCallback()}get z(){return this._z}set z(J){this._z=J,this._onChangeCallback()}get w(){return this._w}set w(J){this._w=J,this._onChangeCallback()}set(J,Q,$,Z){return this._x=J,this._y=Q,this._z=$,this._w=Z,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(J){return this._x=J.x,this._y=J.y,this._z=J.z,this._w=J.w,this._onChangeCallback(),this}setFromEuler(J,Q=!0){let{_x:$,_y:Z,_z:W,_order:K}=J,H=Math.cos,Y=Math.sin,X=H($/2),U=H(Z/2),E=H(W/2),G=Y($/2),N=Y(Z/2),O=Y(W/2);switch(K){case"XYZ":this._x=G*U*E+X*N*O,this._y=X*N*E-G*U*O,this._z=X*U*O+G*N*E,this._w=X*U*E-G*N*O;break;case"YXZ":this._x=G*U*E+X*N*O,this._y=X*N*E-G*U*O,this._z=X*U*O-G*N*E,this._w=X*U*E+G*N*O;break;case"ZXY":this._x=G*U*E-X*N*O,this._y=X*N*E+G*U*O,this._z=X*U*O+G*N*E,this._w=X*U*E-G*N*O;break;case"ZYX":this._x=G*U*E-X*N*O,this._y=X*N*E+G*U*O,this._z=X*U*O-G*N*E,this._w=X*U*E+G*N*O;break;case"YZX":this._x=G*U*E+X*N*O,this._y=X*N*E+G*U*O,this._z=X*U*O-G*N*E,this._w=X*U*E-G*N*O;break;case"XZY":this._x=G*U*E-X*N*O,this._y=X*N*E-G*U*O,this._z=X*U*O+G*N*E,this._w=X*U*E+G*N*O;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+K)}if(Q===!0)this._onChangeCallback();return this}setFromAxisAngle(J,Q){let $=Q/2,Z=Math.sin($);return this._x=J.x*Z,this._y=J.y*Z,this._z=J.z*Z,this._w=Math.cos($),this._onChangeCallback(),this}setFromRotationMatrix(J){let Q=J.elements,$=Q[0],Z=Q[4],W=Q[8],K=Q[1],H=Q[5],Y=Q[9],X=Q[2],U=Q[6],E=Q[10],G=$+H+E;if(G>0){let N=0.5/Math.sqrt(G+1);this._w=0.25/N,this._x=(U-Y)*N,this._y=(W-X)*N,this._z=(K-Z)*N}else if($>H&&$>E){let N=2*Math.sqrt(1+$-H-E);this._w=(U-Y)/N,this._x=0.25*N,this._y=(Z+K)/N,this._z=(W+X)/N}else if(H>E){let N=2*Math.sqrt(1+H-$-E);this._w=(W-X)/N,this._x=(Z+K)/N,this._y=0.25*N,this._z=(Y+U)/N}else{let N=2*Math.sqrt(1+E-$-H);this._w=(K-Z)/N,this._x=(W+X)/N,this._y=(Y+U)/N,this._z=0.25*N}return this._onChangeCallback(),this}setFromUnitVectors(J,Q){let $=J.dot(Q)+1;if($<0.00000001)if($=0,Math.abs(J.x)>Math.abs(J.z))this._x=-J.y,this._y=J.x,this._z=0,this._w=$;else this._x=0,this._y=-J.z,this._z=J.y,this._w=$;else this._x=J.y*Q.z-J.z*Q.y,this._y=J.z*Q.x-J.x*Q.z,this._z=J.x*Q.y-J.y*Q.x,this._w=$;return this.normalize()}angleTo(J){return 2*Math.acos(Math.abs(gJ(this.dot(J),-1,1)))}rotateTowards(J,Q){let $=this.angleTo(J);if($===0)return this;let Z=Math.min(1,Q/$);return this.slerp(J,Z),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(J){return this._x*J._x+this._y*J._y+this._z*J._z+this._w*J._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let J=this.length();if(J===0)this._x=0,this._y=0,this._z=0,this._w=1;else J=1/J,this._x=this._x*J,this._y=this._y*J,this._z=this._z*J,this._w=this._w*J;return this._onChangeCallback(),this}multiply(J){return this.multiplyQuaternions(this,J)}premultiply(J){return this.multiplyQuaternions(J,this)}multiplyQuaternions(J,Q){let{_x:$,_y:Z,_z:W,_w:K}=J,H=Q._x,Y=Q._y,X=Q._z,U=Q._w;return this._x=$*U+K*H+Z*X-W*Y,this._y=Z*U+K*Y+W*H-$*X,this._z=W*U+K*X+$*Y-Z*H,this._w=K*U-$*H-Z*Y-W*X,this._onChangeCallback(),this}slerp(J,Q){if(Q===0)return this;if(Q===1)return this.copy(J);let $=this._x,Z=this._y,W=this._z,K=this._w,H=K*J._w+$*J._x+Z*J._y+W*J._z;if(H<0)this._w=-J._w,this._x=-J._x,this._y=-J._y,this._z=-J._z,H=-H;else this.copy(J);if(H>=1)return this._w=K,this._x=$,this._y=Z,this._z=W,this;let Y=1-H*H;if(Y<=Number.EPSILON){let N=1-Q;return this._w=N*K+Q*this._w,this._x=N*$+Q*this._x,this._y=N*Z+Q*this._y,this._z=N*W+Q*this._z,this.normalize(),this}let X=Math.sqrt(Y),U=Math.atan2(X,H),E=Math.sin((1-Q)*U)/X,G=Math.sin(Q*U)/X;return this._w=K*E+this._w*G,this._x=$*E+this._x*G,this._y=Z*E+this._y*G,this._z=W*E+this._z*G,this._onChangeCallback(),this}slerpQuaternions(J,Q,$){return this.copy(J).slerp(Q,$)}random(){let J=2*Math.PI*Math.random(),Q=2*Math.PI*Math.random(),$=Math.random(),Z=Math.sqrt(1-$),W=Math.sqrt($);return this.set(Z*Math.sin(J),Z*Math.cos(J),W*Math.sin(Q),W*Math.cos(Q))}equals(J){return J._x===this._x&&J._y===this._y&&J._z===this._z&&J._w===this._w}fromArray(J,Q=0){return this._x=J[Q],this._y=J[Q+1],this._z=J[Q+2],this._w=J[Q+3],this._onChangeCallback(),this}toArray(J=[],Q=0){return J[Q]=this._x,J[Q+1]=this._y,J[Q+2]=this._z,J[Q+3]=this._w,J}fromBufferAttribute(J,Q){return this._x=J.getX(Q),this._y=J.getY(Q),this._z=J.getZ(Q),this._w=J.getW(Q),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(J){return this._onChangeCallback=J,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class f{constructor(J=0,Q=0,$=0){f.prototype.isVector3=!0,this.x=J,this.y=Q,this.z=$}set(J,Q,$){if($===void 0)$=this.z;return this.x=J,this.y=Q,this.z=$,this}setScalar(J){return this.x=J,this.y=J,this.z=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setZ(J){return this.z=J,this}setComponent(J,Q){switch(J){case 0:this.x=Q;break;case 1:this.y=Q;break;case 2:this.z=Q;break;default:throw new Error("index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(J){return this.x=J.x,this.y=J.y,this.z=J.z,this}add(J){return this.x+=J.x,this.y+=J.y,this.z+=J.z,this}addScalar(J){return this.x+=J,this.y+=J,this.z+=J,this}addVectors(J,Q){return this.x=J.x+Q.x,this.y=J.y+Q.y,this.z=J.z+Q.z,this}addScaledVector(J,Q){return this.x+=J.x*Q,this.y+=J.y*Q,this.z+=J.z*Q,this}sub(J){return this.x-=J.x,this.y-=J.y,this.z-=J.z,this}subScalar(J){return this.x-=J,this.y-=J,this.z-=J,this}subVectors(J,Q){return this.x=J.x-Q.x,this.y=J.y-Q.y,this.z=J.z-Q.z,this}multiply(J){return this.x*=J.x,this.y*=J.y,this.z*=J.z,this}multiplyScalar(J){return this.x*=J,this.y*=J,this.z*=J,this}multiplyVectors(J,Q){return this.x=J.x*Q.x,this.y=J.y*Q.y,this.z=J.z*Q.z,this}applyEuler(J){return this.applyQuaternion(U$.setFromEuler(J))}applyAxisAngle(J,Q){return this.applyQuaternion(U$.setFromAxisAngle(J,Q))}applyMatrix3(J){let Q=this.x,$=this.y,Z=this.z,W=J.elements;return this.x=W[0]*Q+W[3]*$+W[6]*Z,this.y=W[1]*Q+W[4]*$+W[7]*Z,this.z=W[2]*Q+W[5]*$+W[8]*Z,this}applyNormalMatrix(J){return this.applyMatrix3(J).normalize()}applyMatrix4(J){let Q=this.x,$=this.y,Z=this.z,W=J.elements,K=1/(W[3]*Q+W[7]*$+W[11]*Z+W[15]);return this.x=(W[0]*Q+W[4]*$+W[8]*Z+W[12])*K,this.y=(W[1]*Q+W[5]*$+W[9]*Z+W[13])*K,this.z=(W[2]*Q+W[6]*$+W[10]*Z+W[14])*K,this}applyQuaternion(J){let Q=this.x,$=this.y,Z=this.z,W=J.x,K=J.y,H=J.z,Y=J.w,X=2*(K*Z-H*$),U=2*(H*Q-W*Z),E=2*(W*$-K*Q);return this.x=Q+Y*X+K*E-H*U,this.y=$+Y*U+H*X-W*E,this.z=Z+Y*E+W*U-K*X,this}project(J){return this.applyMatrix4(J.matrixWorldInverse).applyMatrix4(J.projectionMatrix)}unproject(J){return this.applyMatrix4(J.projectionMatrixInverse).applyMatrix4(J.matrixWorld)}transformDirection(J){let Q=this.x,$=this.y,Z=this.z,W=J.elements;return this.x=W[0]*Q+W[4]*$+W[8]*Z,this.y=W[1]*Q+W[5]*$+W[9]*Z,this.z=W[2]*Q+W[6]*$+W[10]*Z,this.normalize()}divide(J){return this.x/=J.x,this.y/=J.y,this.z/=J.z,this}divideScalar(J){return this.multiplyScalar(1/J)}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this.z=Math.min(this.z,J.z),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this.z=Math.max(this.z,J.z),this}clamp(J,Q){return this.x=gJ(this.x,J.x,Q.x),this.y=gJ(this.y,J.y,Q.y),this.z=gJ(this.z,J.z,Q.z),this}clampScalar(J,Q){return this.x=gJ(this.x,J,Q),this.y=gJ(this.y,J,Q),this.z=gJ(this.z,J,Q),this}clampLength(J,Q){let $=this.length();return this.divideScalar($||1).multiplyScalar(gJ($,J,Q))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(J){return this.x*J.x+this.y*J.y+this.z*J.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,Q){return this.x+=(J.x-this.x)*Q,this.y+=(J.y-this.y)*Q,this.z+=(J.z-this.z)*Q,this}lerpVectors(J,Q,$){return this.x=J.x+(Q.x-J.x)*$,this.y=J.y+(Q.y-J.y)*$,this.z=J.z+(Q.z-J.z)*$,this}cross(J){return this.crossVectors(this,J)}crossVectors(J,Q){let{x:$,y:Z,z:W}=J,K=Q.x,H=Q.y,Y=Q.z;return this.x=Z*Y-W*H,this.y=W*K-$*Y,this.z=$*H-Z*K,this}projectOnVector(J){let Q=J.lengthSq();if(Q===0)return this.set(0,0,0);let $=J.dot(this)/Q;return this.copy(J).multiplyScalar($)}projectOnPlane(J){return Z7.copy(this).projectOnVector(J),this.sub(Z7)}reflect(J){return this.sub(Z7.copy(J).multiplyScalar(2*this.dot(J)))}angleTo(J){let Q=Math.sqrt(this.lengthSq()*J.lengthSq());if(Q===0)return Math.PI/2;let $=this.dot(J)/Q;return Math.acos(gJ($,-1,1))}distanceTo(J){return Math.sqrt(this.distanceToSquared(J))}distanceToSquared(J){let Q=this.x-J.x,$=this.y-J.y,Z=this.z-J.z;return Q*Q+$*$+Z*Z}manhattanDistanceTo(J){return Math.abs(this.x-J.x)+Math.abs(this.y-J.y)+Math.abs(this.z-J.z)}setFromSpherical(J){return this.setFromSphericalCoords(J.radius,J.phi,J.theta)}setFromSphericalCoords(J,Q,$){let Z=Math.sin(Q)*J;return this.x=Z*Math.sin($),this.y=Math.cos(Q)*J,this.z=Z*Math.cos($),this}setFromCylindrical(J){return this.setFromCylindricalCoords(J.radius,J.theta,J.y)}setFromCylindricalCoords(J,Q,$){return this.x=J*Math.sin(Q),this.y=$,this.z=J*Math.cos(Q),this}setFromMatrixPosition(J){let Q=J.elements;return this.x=Q[12],this.y=Q[13],this.z=Q[14],this}setFromMatrixScale(J){let Q=this.setFromMatrixColumn(J,0).length(),$=this.setFromMatrixColumn(J,1).length(),Z=this.setFromMatrixColumn(J,2).length();return this.x=Q,this.y=$,this.z=Z,this}setFromMatrixColumn(J,Q){return this.fromArray(J.elements,Q*4)}setFromMatrix3Column(J,Q){return this.fromArray(J.elements,Q*3)}setFromEuler(J){return this.x=J._x,this.y=J._y,this.z=J._z,this}setFromColor(J){return this.x=J.r,this.y=J.g,this.z=J.b,this}equals(J){return J.x===this.x&&J.y===this.y&&J.z===this.z}fromArray(J,Q=0){return this.x=J[Q],this.y=J[Q+1],this.z=J[Q+2],this}toArray(J=[],Q=0){return J[Q]=this.x,J[Q+1]=this.y,J[Q+2]=this.z,J}fromBufferAttribute(J,Q){return this.x=J.getX(Q),this.y=J.getY(Q),this.z=J.getZ(Q),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let J=Math.random()*Math.PI*2,Q=Math.random()*2-1,$=Math.sqrt(1-Q*Q);return this.x=$*Math.cos(J),this.y=Q,this.z=$*Math.sin(J),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}var Z7=new f,U$=new M8;class vJ{constructor(J,Q,$,Z,W,K,H,Y,X){if(vJ.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],J!==void 0)this.set(J,Q,$,Z,W,K,H,Y,X)}set(J,Q,$,Z,W,K,H,Y,X){let U=this.elements;return U[0]=J,U[1]=Z,U[2]=H,U[3]=Q,U[4]=W,U[5]=Y,U[6]=$,U[7]=K,U[8]=X,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(J){let Q=this.elements,$=J.elements;return Q[0]=$[0],Q[1]=$[1],Q[2]=$[2],Q[3]=$[3],Q[4]=$[4],Q[5]=$[5],Q[6]=$[6],Q[7]=$[7],Q[8]=$[8],this}extractBasis(J,Q,$){return J.setFromMatrix3Column(this,0),Q.setFromMatrix3Column(this,1),$.setFromMatrix3Column(this,2),this}setFromMatrix4(J){let Q=J.elements;return this.set(Q[0],Q[4],Q[8],Q[1],Q[5],Q[9],Q[2],Q[6],Q[10]),this}multiply(J){return this.multiplyMatrices(this,J)}premultiply(J){return this.multiplyMatrices(J,this)}multiplyMatrices(J,Q){let $=J.elements,Z=Q.elements,W=this.elements,K=$[0],H=$[3],Y=$[6],X=$[1],U=$[4],E=$[7],G=$[2],N=$[5],O=$[8],M=Z[0],k=Z[3],q=Z[6],D=Z[1],P=Z[4],V=Z[7],I=Z[2],S=Z[5],C=Z[8];return W[0]=K*M+H*D+Y*I,W[3]=K*k+H*P+Y*S,W[6]=K*q+H*V+Y*C,W[1]=X*M+U*D+E*I,W[4]=X*k+U*P+E*S,W[7]=X*q+U*V+E*C,W[2]=G*M+N*D+O*I,W[5]=G*k+N*P+O*S,W[8]=G*q+N*V+O*C,this}multiplyScalar(J){let Q=this.elements;return Q[0]*=J,Q[3]*=J,Q[6]*=J,Q[1]*=J,Q[4]*=J,Q[7]*=J,Q[2]*=J,Q[5]*=J,Q[8]*=J,this}determinant(){let J=this.elements,Q=J[0],$=J[1],Z=J[2],W=J[3],K=J[4],H=J[5],Y=J[6],X=J[7],U=J[8];return Q*K*U-Q*H*X-$*W*U+$*H*Y+Z*W*X-Z*K*Y}invert(){let J=this.elements,Q=J[0],$=J[1],Z=J[2],W=J[3],K=J[4],H=J[5],Y=J[6],X=J[7],U=J[8],E=U*K-H*X,G=H*Y-U*W,N=X*W-K*Y,O=Q*E+$*G+Z*N;if(O===0)return this.set(0,0,0,0,0,0,0,0,0);let M=1/O;return J[0]=E*M,J[1]=(Z*X-U*$)*M,J[2]=(H*$-Z*K)*M,J[3]=G*M,J[4]=(U*Q-Z*Y)*M,J[5]=(Z*W-H*Q)*M,J[6]=N*M,J[7]=($*Y-X*Q)*M,J[8]=(K*Q-$*W)*M,this}transpose(){let J,Q=this.elements;return J=Q[1],Q[1]=Q[3],Q[3]=J,J=Q[2],Q[2]=Q[6],Q[6]=J,J=Q[5],Q[5]=Q[7],Q[7]=J,this}getNormalMatrix(J){return this.setFromMatrix4(J).invert().transpose()}transposeIntoArray(J){let Q=this.elements;return J[0]=Q[0],J[1]=Q[3],J[2]=Q[6],J[3]=Q[1],J[4]=Q[4],J[5]=Q[7],J[6]=Q[2],J[7]=Q[5],J[8]=Q[8],this}setUvTransform(J,Q,$,Z,W,K,H){let Y=Math.cos(W),X=Math.sin(W);return this.set($*Y,$*X,-$*(Y*K+X*H)+K+J,-Z*X,Z*Y,-Z*(-X*K+Y*H)+H+Q,0,0,1),this}scale(J,Q){return this.premultiply(W7.makeScale(J,Q)),this}rotate(J){return this.premultiply(W7.makeRotation(-J)),this}translate(J,Q){return this.premultiply(W7.makeTranslation(J,Q)),this}makeTranslation(J,Q){if(J.isVector2)this.set(1,0,J.x,0,1,J.y,0,0,1);else this.set(1,0,J,0,1,Q,0,0,1);return this}makeRotation(J){let Q=Math.cos(J),$=Math.sin(J);return this.set(Q,-$,0,$,Q,0,0,0,1),this}makeScale(J,Q){return this.set(J,0,0,0,Q,0,0,0,1),this}equals(J){let Q=this.elements,$=J.elements;for(let Z=0;Z<9;Z++)if(Q[Z]!==$[Z])return!1;return!0}fromArray(J,Q=0){for(let $=0;$<9;$++)this.elements[$]=J[$+Q];return this}toArray(J=[],Q=0){let $=this.elements;return J[Q]=$[0],J[Q+1]=$[1],J[Q+2]=$[2],J[Q+3]=$[3],J[Q+4]=$[4],J[Q+5]=$[5],J[Q+6]=$[6],J[Q+7]=$[7],J[Q+8]=$[8],J}clone(){return new this.constructor().fromArray(this.elements)}}var W7=new vJ;function DQ(J){for(let Q=J.length-1;Q>=0;--Q)if(J[Q]>=65535)return!0;return!1}function _9(J){return document.createElementNS("http://www.w3.org/1999/xhtml",J)}function fZ(){let J=_9("canvas");return J.style.display="block",J}var G$={};function Z9(J){if(J in G$)return;G$[J]=!0,console.warn(J)}function bZ(J,Q,$){return new Promise(function(Z,W){function K(){switch(J.clientWaitSync(Q,J.SYNC_FLUSH_COMMANDS_BIT,0)){case J.WAIT_FAILED:W();break;case J.TIMEOUT_EXPIRED:setTimeout(K,$);break;default:Z()}}setTimeout(K,$)})}var E$=new vJ().set(0.4123908,0.3575843,0.1804808,0.212639,0.7151687,0.0721923,0.0193308,0.1191948,0.9505322),N$=new vJ().set(3.2409699,-1.5373832,-0.4986108,-0.9692436,1.8759675,0.0415551,0.0556301,-0.203977,1.0569715);function hW(){let J={enabled:!0,workingColorSpace:"srgb-linear",spaces:{},convert:function(W,K,H){if(this.enabled===!1||K===H||!K||!H)return W;if(this.spaces[K].transfer==="srgb")W.r=W8(W.r),W.g=W8(W.g),W.b=W8(W.b);if(this.spaces[K].primaries!==this.spaces[H].primaries)W.applyMatrix3(this.spaces[K].toXYZ),W.applyMatrix3(this.spaces[H].fromXYZ);if(this.spaces[H].transfer==="srgb")W.r=$9(W.r),W.g=$9(W.g),W.b=$9(W.b);return W},workingToColorSpace:function(W,K){return this.convert(W,this.workingColorSpace,K)},colorSpaceToWorking:function(W,K){return this.convert(W,K,this.workingColorSpace)},getPrimaries:function(W){return this.spaces[W].primaries},getTransfer:function(W){if(W==="")return"linear";return this.spaces[W].transfer},getToneMappingMode:function(W){return this.spaces[W].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(W,K=this.workingColorSpace){return W.fromArray(this.spaces[K].luminanceCoefficients)},define:function(W){Object.assign(this.spaces,W)},_getMatrix:function(W,K,H){return W.copy(this.spaces[K].toXYZ).multiply(this.spaces[H].fromXYZ)},_getDrawingBufferColorSpace:function(W){return this.spaces[W].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(W=this.workingColorSpace){return this.spaces[W].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(W,K){return Z9("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),J.workingToColorSpace(W,K)},toWorkingColorSpace:function(W,K){return Z9("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),J.colorSpaceToWorking(W,K)}},Q=[0.64,0.33,0.3,0.6,0.15,0.06],$=[0.2126,0.7152,0.0722],Z=[0.3127,0.329];return J.define({["srgb-linear"]:{primaries:Q,whitePoint:Z,transfer:"linear",toXYZ:E$,fromXYZ:N$,luminanceCoefficients:$,workingColorSpaceConfig:{unpackColorSpace:"srgb"},outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}},["srgb"]:{primaries:Q,whitePoint:Z,transfer:"srgb",toXYZ:E$,fromXYZ:N$,luminanceCoefficients:$,outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}}}),J}var pJ=hW();function W8(J){return J<0.04045?J*0.0773993808:Math.pow(J*0.9478672986+0.0521327014,2.4)}function $9(J){return J<0.0031308?J*12.92:1.055*Math.pow(J,0.41666)-0.055}var u8;class OQ{static getDataURL(J,Q="image/png"){if(/^data:/i.test(J.src))return J.src;if(typeof HTMLCanvasElement==="undefined")return J.src;let $;if(J instanceof HTMLCanvasElement)$=J;else{if(u8===void 0)u8=_9("canvas");u8.width=J.width,u8.height=J.height;let Z=u8.getContext("2d");if(J instanceof ImageData)Z.putImageData(J,0,0);else Z.drawImage(J,0,0,J.width,J.height);$=u8}return $.toDataURL(Q)}static sRGBToLinear(J){if(typeof HTMLImageElement!=="undefined"&&J instanceof HTMLImageElement||typeof HTMLCanvasElement!=="undefined"&&J instanceof HTMLCanvasElement||typeof ImageBitmap!=="undefined"&&J instanceof ImageBitmap){let Q=_9("canvas");Q.width=J.width,Q.height=J.height;let $=Q.getContext("2d");$.drawImage(J,0,0,J.width,J.height);let Z=$.getImageData(0,0,J.width,J.height),W=Z.data;for(let K=0;K<W.length;K++)W[K]=W8(W[K]/255)*255;return $.putImageData(Z,0,0),Q}else if(J.data){let Q=J.data.slice(0);for(let $=0;$<Q.length;$++)if(Q instanceof Uint8Array||Q instanceof Uint8ClampedArray)Q[$]=Math.floor(W8(Q[$]/255)*255);else Q[$]=W8(Q[$]);return{data:Q,width:J.width,height:J.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),J}}var xW=0;class f9{constructor(J=null){this.isSource=!0,Object.defineProperty(this,"id",{value:xW++}),this.uuid=v9(),this.data=J,this.dataReady=!0,this.version=0}getSize(J){let Q=this.data;if(typeof HTMLVideoElement!=="undefined"&&Q instanceof HTMLVideoElement)J.set(Q.videoWidth,Q.videoHeight,0);else if(Q instanceof VideoFrame)J.set(Q.displayHeight,Q.displayWidth,0);else if(Q!==null)J.set(Q.width,Q.height,Q.depth||0);else J.set(0,0,0);return J}set needsUpdate(J){if(J===!0)this.version++}toJSON(J){let Q=J===void 0||typeof J==="string";if(!Q&&J.images[this.uuid]!==void 0)return J.images[this.uuid];let $={uuid:this.uuid,url:""},Z=this.data;if(Z!==null){let W;if(Array.isArray(Z)){W=[];for(let K=0,H=Z.length;K<H;K++)if(Z[K].isDataTexture)W.push(K7(Z[K].image));else W.push(K7(Z[K]))}else W=K7(Z);$.url=W}if(!Q)J.images[this.uuid]=$;return $}}function K7(J){if(typeof HTMLImageElement!=="undefined"&&J instanceof HTMLImageElement||typeof HTMLCanvasElement!=="undefined"&&J instanceof HTMLCanvasElement||typeof ImageBitmap!=="undefined"&&J instanceof ImageBitmap)return OQ.getDataURL(J);else if(J.data)return{data:Array.from(J.data),width:J.width,height:J.height,type:J.data.constructor.name};else return console.warn("THREE.Texture: Unable to serialize Texture."),{}}var gW=0,Y7=new f;class z0 extends F8{constructor(J=z0.DEFAULT_IMAGE,Q=z0.DEFAULT_MAPPING,$=1001,Z=1001,W=1006,K=1008,H=1023,Y=1009,X=z0.DEFAULT_ANISOTROPY,U=""){super();this.isTexture=!0,Object.defineProperty(this,"id",{value:gW++}),this.uuid=v9(),this.name="",this.source=new f9(J),this.mipmaps=[],this.mapping=Q,this.channel=0,this.wrapS=$,this.wrapT=Z,this.magFilter=W,this.minFilter=K,this.anisotropy=X,this.format=H,this.internalFormat=null,this.type=Y,this.offset=new cJ(0,0),this.repeat=new cJ(1,1),this.center=new cJ(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new vJ,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=U,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=J&&J.depth&&J.depth>1?!0:!1,this.pmremVersion=0}get width(){return this.source.getSize(Y7).x}get height(){return this.source.getSize(Y7).y}get depth(){return this.source.getSize(Y7).z}get image(){return this.source.data}set image(J=null){this.source.data=J}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(J,Q){this.updateRanges.push({start:J,count:Q})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(J){return this.name=J.name,this.source=J.source,this.mipmaps=J.mipmaps.slice(0),this.mapping=J.mapping,this.channel=J.channel,this.wrapS=J.wrapS,this.wrapT=J.wrapT,this.magFilter=J.magFilter,this.minFilter=J.minFilter,this.anisotropy=J.anisotropy,this.format=J.format,this.internalFormat=J.internalFormat,this.type=J.type,this.offset.copy(J.offset),this.repeat.copy(J.repeat),this.center.copy(J.center),this.rotation=J.rotation,this.matrixAutoUpdate=J.matrixAutoUpdate,this.matrix.copy(J.matrix),this.generateMipmaps=J.generateMipmaps,this.premultiplyAlpha=J.premultiplyAlpha,this.flipY=J.flipY,this.unpackAlignment=J.unpackAlignment,this.colorSpace=J.colorSpace,this.renderTarget=J.renderTarget,this.isRenderTargetTexture=J.isRenderTargetTexture,this.isArrayTexture=J.isArrayTexture,this.userData=JSON.parse(JSON.stringify(J.userData)),this.needsUpdate=!0,this}setValues(J){for(let Q in J){let $=J[Q];if($===void 0){console.warn(`THREE.Texture.setValues(): parameter '${Q}' has value of undefined.`);continue}let Z=this[Q];if(Z===void 0){console.warn(`THREE.Texture.setValues(): property '${Q}' does not exist.`);continue}if(Z&&$&&(Z.isVector2&&$.isVector2))Z.copy($);else if(Z&&$&&(Z.isVector3&&$.isVector3))Z.copy($);else if(Z&&$&&(Z.isMatrix3&&$.isMatrix3))Z.copy($);else this[Q]=$}}toJSON(J){let Q=J===void 0||typeof J==="string";if(!Q&&J.textures[this.uuid]!==void 0)return J.textures[this.uuid];let $={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(J).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};if(Object.keys(this.userData).length>0)$.userData=this.userData;if(!Q)J.textures[this.uuid]=$;return $}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(J){if(this.mapping!==300)return J;if(J.applyMatrix3(this.matrix),J.x<0||J.x>1)switch(this.wrapS){case 1000:J.x=J.x-Math.floor(J.x);break;case 1001:J.x=J.x<0?0:1;break;case 1002:if(Math.abs(Math.floor(J.x)%2)===1)J.x=Math.ceil(J.x)-J.x;else J.x=J.x-Math.floor(J.x);break}if(J.y<0||J.y>1)switch(this.wrapT){case 1000:J.y=J.y-Math.floor(J.y);break;case 1001:J.y=J.y<0?0:1;break;case 1002:if(Math.abs(Math.floor(J.y)%2)===1)J.y=Math.ceil(J.y)-J.y;else J.y=J.y-Math.floor(J.y);break}if(this.flipY)J.y=1-J.y;return J}set needsUpdate(J){if(J===!0)this.version++,this.source.needsUpdate=!0}set needsPMREMUpdate(J){if(J===!0)this.pmremVersion++}}z0.DEFAULT_IMAGE=null;z0.DEFAULT_MAPPING=300;z0.DEFAULT_ANISOTROPY=1;class K0{constructor(J=0,Q=0,$=0,Z=1){K0.prototype.isVector4=!0,this.x=J,this.y=Q,this.z=$,this.w=Z}get width(){return this.z}set width(J){this.z=J}get height(){return this.w}set height(J){this.w=J}set(J,Q,$,Z){return this.x=J,this.y=Q,this.z=$,this.w=Z,this}setScalar(J){return this.x=J,this.y=J,this.z=J,this.w=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setZ(J){return this.z=J,this}setW(J){return this.w=J,this}setComponent(J,Q){switch(J){case 0:this.x=Q;break;case 1:this.y=Q;break;case 2:this.z=Q;break;case 3:this.w=Q;break;default:throw new Error("index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(J){return this.x=J.x,this.y=J.y,this.z=J.z,this.w=J.w!==void 0?J.w:1,this}add(J){return this.x+=J.x,this.y+=J.y,this.z+=J.z,this.w+=J.w,this}addScalar(J){return this.x+=J,this.y+=J,this.z+=J,this.w+=J,this}addVectors(J,Q){return this.x=J.x+Q.x,this.y=J.y+Q.y,this.z=J.z+Q.z,this.w=J.w+Q.w,this}addScaledVector(J,Q){return this.x+=J.x*Q,this.y+=J.y*Q,this.z+=J.z*Q,this.w+=J.w*Q,this}sub(J){return this.x-=J.x,this.y-=J.y,this.z-=J.z,this.w-=J.w,this}subScalar(J){return this.x-=J,this.y-=J,this.z-=J,this.w-=J,this}subVectors(J,Q){return this.x=J.x-Q.x,this.y=J.y-Q.y,this.z=J.z-Q.z,this.w=J.w-Q.w,this}multiply(J){return this.x*=J.x,this.y*=J.y,this.z*=J.z,this.w*=J.w,this}multiplyScalar(J){return this.x*=J,this.y*=J,this.z*=J,this.w*=J,this}applyMatrix4(J){let Q=this.x,$=this.y,Z=this.z,W=this.w,K=J.elements;return this.x=K[0]*Q+K[4]*$+K[8]*Z+K[12]*W,this.y=K[1]*Q+K[5]*$+K[9]*Z+K[13]*W,this.z=K[2]*Q+K[6]*$+K[10]*Z+K[14]*W,this.w=K[3]*Q+K[7]*$+K[11]*Z+K[15]*W,this}divide(J){return this.x/=J.x,this.y/=J.y,this.z/=J.z,this.w/=J.w,this}divideScalar(J){return this.multiplyScalar(1/J)}setAxisAngleFromQuaternion(J){this.w=2*Math.acos(J.w);let Q=Math.sqrt(1-J.w*J.w);if(Q<0.0001)this.x=1,this.y=0,this.z=0;else this.x=J.x/Q,this.y=J.y/Q,this.z=J.z/Q;return this}setAxisAngleFromRotationMatrix(J){let Q,$,Z,W,K=0.01,H=0.1,Y=J.elements,X=Y[0],U=Y[4],E=Y[8],G=Y[1],N=Y[5],O=Y[9],M=Y[2],k=Y[6],q=Y[10];if(Math.abs(U-G)<0.01&&Math.abs(E-M)<0.01&&Math.abs(O-k)<0.01){if(Math.abs(U+G)<0.1&&Math.abs(E+M)<0.1&&Math.abs(O+k)<0.1&&Math.abs(X+N+q-3)<0.1)return this.set(1,0,0,0),this;Q=Math.PI;let P=(X+1)/2,V=(N+1)/2,I=(q+1)/2,S=(U+G)/4,C=(E+M)/4,A=(O+k)/4;if(P>V&&P>I)if(P<0.01)$=0,Z=0.707106781,W=0.707106781;else $=Math.sqrt(P),Z=S/$,W=C/$;else if(V>I)if(V<0.01)$=0.707106781,Z=0,W=0.707106781;else Z=Math.sqrt(V),$=S/Z,W=A/Z;else if(I<0.01)$=0.707106781,Z=0.707106781,W=0;else W=Math.sqrt(I),$=C/W,Z=A/W;return this.set($,Z,W,Q),this}let D=Math.sqrt((k-O)*(k-O)+(E-M)*(E-M)+(G-U)*(G-U));if(Math.abs(D)<0.001)D=1;return this.x=(k-O)/D,this.y=(E-M)/D,this.z=(G-U)/D,this.w=Math.acos((X+N+q-1)/2),this}setFromMatrixPosition(J){let Q=J.elements;return this.x=Q[12],this.y=Q[13],this.z=Q[14],this.w=Q[15],this}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this.z=Math.min(this.z,J.z),this.w=Math.min(this.w,J.w),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this.z=Math.max(this.z,J.z),this.w=Math.max(this.w,J.w),this}clamp(J,Q){return this.x=gJ(this.x,J.x,Q.x),this.y=gJ(this.y,J.y,Q.y),this.z=gJ(this.z,J.z,Q.z),this.w=gJ(this.w,J.w,Q.w),this}clampScalar(J,Q){return this.x=gJ(this.x,J,Q),this.y=gJ(this.y,J,Q),this.z=gJ(this.z,J,Q),this.w=gJ(this.w,J,Q),this}clampLength(J,Q){let $=this.length();return this.divideScalar($||1).multiplyScalar(gJ($,J,Q))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(J){return this.x*J.x+this.y*J.y+this.z*J.z+this.w*J.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,Q){return this.x+=(J.x-this.x)*Q,this.y+=(J.y-this.y)*Q,this.z+=(J.z-this.z)*Q,this.w+=(J.w-this.w)*Q,this}lerpVectors(J,Q,$){return this.x=J.x+(Q.x-J.x)*$,this.y=J.y+(Q.y-J.y)*$,this.z=J.z+(Q.z-J.z)*$,this.w=J.w+(Q.w-J.w)*$,this}equals(J){return J.x===this.x&&J.y===this.y&&J.z===this.z&&J.w===this.w}fromArray(J,Q=0){return this.x=J[Q],this.y=J[Q+1],this.z=J[Q+2],this.w=J[Q+3],this}toArray(J=[],Q=0){return J[Q]=this.x,J[Q+1]=this.y,J[Q+2]=this.z,J[Q+3]=this.w,J}fromBufferAttribute(J,Q){return this.x=J.getX(Q),this.y=J.getY(Q),this.z=J.getZ(Q),this.w=J.getW(Q),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class RQ extends F8{constructor(J=1,Q=1,$={}){super();$=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},$),this.isRenderTarget=!0,this.width=J,this.height=Q,this.depth=$.depth,this.scissor=new K0(0,0,J,Q),this.scissorTest=!1,this.viewport=new K0(0,0,J,Q);let Z={width:J,height:Q,depth:$.depth},W=new z0(Z);this.textures=[];let K=$.count;for(let H=0;H<K;H++)this.textures[H]=W.clone(),this.textures[H].isRenderTargetTexture=!0,this.textures[H].renderTarget=this;this._setTextureOptions($),this.depthBuffer=$.depthBuffer,this.stencilBuffer=$.stencilBuffer,this.resolveDepthBuffer=$.resolveDepthBuffer,this.resolveStencilBuffer=$.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=$.depthTexture,this.samples=$.samples,this.multiview=$.multiview}_setTextureOptions(J={}){let Q={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};if(J.mapping!==void 0)Q.mapping=J.mapping;if(J.wrapS!==void 0)Q.wrapS=J.wrapS;if(J.wrapT!==void 0)Q.wrapT=J.wrapT;if(J.wrapR!==void 0)Q.wrapR=J.wrapR;if(J.magFilter!==void 0)Q.magFilter=J.magFilter;if(J.minFilter!==void 0)Q.minFilter=J.minFilter;if(J.format!==void 0)Q.format=J.format;if(J.type!==void 0)Q.type=J.type;if(J.anisotropy!==void 0)Q.anisotropy=J.anisotropy;if(J.colorSpace!==void 0)Q.colorSpace=J.colorSpace;if(J.flipY!==void 0)Q.flipY=J.flipY;if(J.generateMipmaps!==void 0)Q.generateMipmaps=J.generateMipmaps;if(J.internalFormat!==void 0)Q.internalFormat=J.internalFormat;for(let $=0;$<this.textures.length;$++)this.textures[$].setValues(Q)}get texture(){return this.textures[0]}set texture(J){this.textures[0]=J}set depthTexture(J){if(this._depthTexture!==null)this._depthTexture.renderTarget=null;if(J!==null)J.renderTarget=this;this._depthTexture=J}get depthTexture(){return this._depthTexture}setSize(J,Q,$=1){if(this.width!==J||this.height!==Q||this.depth!==$){this.width=J,this.height=Q,this.depth=$;for(let Z=0,W=this.textures.length;Z<W;Z++)this.textures[Z].image.width=J,this.textures[Z].image.height=Q,this.textures[Z].image.depth=$,this.textures[Z].isArrayTexture=this.textures[Z].image.depth>1;this.dispose()}this.viewport.set(0,0,J,Q),this.scissor.set(0,0,J,Q)}clone(){return new this.constructor().copy(this)}copy(J){this.width=J.width,this.height=J.height,this.depth=J.depth,this.scissor.copy(J.scissor),this.scissorTest=J.scissorTest,this.viewport.copy(J.viewport),this.textures.length=0;for(let Q=0,$=J.textures.length;Q<$;Q++){this.textures[Q]=J.textures[Q].clone(),this.textures[Q].isRenderTargetTexture=!0,this.textures[Q].renderTarget=this;let Z=Object.assign({},J.textures[Q].image);this.textures[Q].source=new f9(Z)}if(this.depthBuffer=J.depthBuffer,this.stencilBuffer=J.stencilBuffer,this.resolveDepthBuffer=J.resolveDepthBuffer,this.resolveStencilBuffer=J.resolveStencilBuffer,J.depthTexture!==null)this.depthTexture=J.depthTexture.clone();return this.samples=J.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Y8 extends RQ{constructor(J=1,Q=1,$={}){super(J,Q,$);this.isWebGLRenderTarget=!0}}class j6 extends z0{constructor(J=null,Q=1,$=1,Z=1){super(null);this.isDataArrayTexture=!0,this.image={data:J,width:Q,height:$,depth:Z},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(J){this.layerUpdates.add(J)}clearLayerUpdates(){this.layerUpdates.clear()}}class FQ extends z0{constructor(J=null,Q=1,$=1,Z=1){super(null);this.isData3DTexture=!0,this.image={data:J,width:Q,height:$,depth:Z},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class j8{constructor(J=new f(1/0,1/0,1/0),Q=new f(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=J,this.max=Q}set(J,Q){return this.min.copy(J),this.max.copy(Q),this}setFromArray(J){this.makeEmpty();for(let Q=0,$=J.length;Q<$;Q+=3)this.expandByPoint(g0.fromArray(J,Q));return this}setFromBufferAttribute(J){this.makeEmpty();for(let Q=0,$=J.count;Q<$;Q++)this.expandByPoint(g0.fromBufferAttribute(J,Q));return this}setFromPoints(J){this.makeEmpty();for(let Q=0,$=J.length;Q<$;Q++)this.expandByPoint(J[Q]);return this}setFromCenterAndSize(J,Q){let $=g0.copy(Q).multiplyScalar(0.5);return this.min.copy(J).sub($),this.max.copy(J).add($),this}setFromObject(J,Q=!1){return this.makeEmpty(),this.expandByObject(J,Q)}clone(){return new this.constructor().copy(this)}copy(J){return this.min.copy(J.min),this.max.copy(J.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(J){return this.isEmpty()?J.set(0,0,0):J.addVectors(this.min,this.max).multiplyScalar(0.5)}getSize(J){return this.isEmpty()?J.set(0,0,0):J.subVectors(this.max,this.min)}expandByPoint(J){return this.min.min(J),this.max.max(J),this}expandByVector(J){return this.min.sub(J),this.max.add(J),this}expandByScalar(J){return this.min.addScalar(-J),this.max.addScalar(J),this}expandByObject(J,Q=!1){J.updateWorldMatrix(!1,!1);let $=J.geometry;if($!==void 0){let W=$.getAttribute("position");if(Q===!0&&W!==void 0&&J.isInstancedMesh!==!0)for(let K=0,H=W.count;K<H;K++){if(J.isMesh===!0)J.getVertexPosition(K,g0);else g0.fromBufferAttribute(W,K);g0.applyMatrix4(J.matrixWorld),this.expandByPoint(g0)}else{if(J.boundingBox!==void 0){if(J.boundingBox===null)J.computeBoundingBox();n9.copy(J.boundingBox)}else{if($.boundingBox===null)$.computeBoundingBox();n9.copy($.boundingBox)}n9.applyMatrix4(J.matrixWorld),this.union(n9)}}let Z=J.children;for(let W=0,K=Z.length;W<K;W++)this.expandByObject(Z[W],Q);return this}containsPoint(J){return J.x>=this.min.x&&J.x<=this.max.x&&J.y>=this.min.y&&J.y<=this.max.y&&J.z>=this.min.z&&J.z<=this.max.z}containsBox(J){return this.min.x<=J.min.x&&J.max.x<=this.max.x&&this.min.y<=J.min.y&&J.max.y<=this.max.y&&this.min.z<=J.min.z&&J.max.z<=this.max.z}getParameter(J,Q){return Q.set((J.x-this.min.x)/(this.max.x-this.min.x),(J.y-this.min.y)/(this.max.y-this.min.y),(J.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(J){return J.max.x>=this.min.x&&J.min.x<=this.max.x&&J.max.y>=this.min.y&&J.min.y<=this.max.y&&J.max.z>=this.min.z&&J.min.z<=this.max.z}intersectsSphere(J){return this.clampPoint(J.center,g0),g0.distanceToSquared(J.center)<=J.radius*J.radius}intersectsPlane(J){let Q,$;if(J.normal.x>0)Q=J.normal.x*this.min.x,$=J.normal.x*this.max.x;else Q=J.normal.x*this.max.x,$=J.normal.x*this.min.x;if(J.normal.y>0)Q+=J.normal.y*this.min.y,$+=J.normal.y*this.max.y;else Q+=J.normal.y*this.max.y,$+=J.normal.y*this.min.y;if(J.normal.z>0)Q+=J.normal.z*this.min.z,$+=J.normal.z*this.max.z;else Q+=J.normal.z*this.max.z,$+=J.normal.z*this.min.z;return Q<=-J.constant&&$>=-J.constant}intersectsTriangle(J){if(this.isEmpty())return!1;this.getCenter(V9),s9.subVectors(this.max,V9),c8.subVectors(J.a,V9),n8.subVectors(J.b,V9),s8.subVectors(J.c,V9),H8.subVectors(n8,c8),X8.subVectors(s8,n8),I8.subVectors(c8,s8);let Q=[0,-H8.z,H8.y,0,-X8.z,X8.y,0,-I8.z,I8.y,H8.z,0,-H8.x,X8.z,0,-X8.x,I8.z,0,-I8.x,-H8.y,H8.x,0,-X8.y,X8.x,0,-I8.y,I8.x,0];if(!H7(Q,c8,n8,s8,s9))return!1;if(Q=[1,0,0,0,1,0,0,0,1],!H7(Q,c8,n8,s8,s9))return!1;return i9.crossVectors(H8,X8),Q=[i9.x,i9.y,i9.z],H7(Q,c8,n8,s8,s9)}clampPoint(J,Q){return Q.copy(J).clamp(this.min,this.max)}distanceToPoint(J){return this.clampPoint(J,g0).distanceTo(J)}getBoundingSphere(J){if(this.isEmpty())J.makeEmpty();else this.getCenter(J.center),J.radius=this.getSize(g0).length()*0.5;return J}intersect(J){if(this.min.max(J.min),this.max.min(J.max),this.isEmpty())this.makeEmpty();return this}union(J){return this.min.min(J.min),this.max.max(J.max),this}applyMatrix4(J){if(this.isEmpty())return this;return t0[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(J),t0[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(J),t0[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(J),t0[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(J),t0[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(J),t0[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(J),t0[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(J),t0[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(J),this.setFromPoints(t0),this}translate(J){return this.min.add(J),this.max.add(J),this}equals(J){return J.min.equals(this.min)&&J.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(J){return this.min.fromArray(J.min),this.max.fromArray(J.max),this}}var t0=[new f,new f,new f,new f,new f,new f,new f,new f],g0=new f,n9=new j8,c8=new f,n8=new f,s8=new f,H8=new f,X8=new f,I8=new f,V9=new f,s9=new f,i9=new f,_8=new f;function H7(J,Q,$,Z,W){for(let K=0,H=J.length-3;K<=H;K+=3){_8.fromArray(J,K);let Y=W.x*Math.abs(_8.x)+W.y*Math.abs(_8.y)+W.z*Math.abs(_8.z),X=Q.dot(_8),U=$.dot(_8),E=Z.dot(_8);if(Math.max(-Math.max(X,U,E),Math.min(X,U,E))>Y)return!1}return!0}var pW=new j8,L9=new f,X7=new f;class y8{constructor(J=new f,Q=-1){this.isSphere=!0,this.center=J,this.radius=Q}set(J,Q){return this.center.copy(J),this.radius=Q,this}setFromPoints(J,Q){let $=this.center;if(Q!==void 0)$.copy(Q);else pW.setFromPoints(J).getCenter($);let Z=0;for(let W=0,K=J.length;W<K;W++)Z=Math.max(Z,$.distanceToSquared(J[W]));return this.radius=Math.sqrt(Z),this}copy(J){return this.center.copy(J.center),this.radius=J.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(J){return J.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(J){return J.distanceTo(this.center)-this.radius}intersectsSphere(J){let Q=this.radius+J.radius;return J.center.distanceToSquared(this.center)<=Q*Q}intersectsBox(J){return J.intersectsSphere(this)}intersectsPlane(J){return Math.abs(J.distanceToPoint(this.center))<=this.radius}clampPoint(J,Q){let $=this.center.distanceToSquared(J);if(Q.copy(J),$>this.radius*this.radius)Q.sub(this.center).normalize(),Q.multiplyScalar(this.radius).add(this.center);return Q}getBoundingBox(J){if(this.isEmpty())return J.makeEmpty(),J;return J.set(this.center,this.center),J.expandByScalar(this.radius),J}applyMatrix4(J){return this.center.applyMatrix4(J),this.radius=this.radius*J.getMaxScaleOnAxis(),this}translate(J){return this.center.add(J),this}expandByPoint(J){if(this.isEmpty())return this.center.copy(J),this.radius=0,this;L9.subVectors(J,this.center);let Q=L9.lengthSq();if(Q>this.radius*this.radius){let $=Math.sqrt(Q),Z=($-this.radius)*0.5;this.center.addScaledVector(L9,Z/$),this.radius+=Z}return this}union(J){if(J.isEmpty())return this;if(this.isEmpty())return this.copy(J),this;if(this.center.equals(J.center)===!0)this.radius=Math.max(this.radius,J.radius);else X7.subVectors(J.center,this.center).setLength(J.radius),this.expandByPoint(L9.copy(J.center).add(X7)),this.expandByPoint(L9.copy(J.center).sub(X7));return this}equals(J){return J.center.equals(this.center)&&J.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(J){return this.radius=J.radius,this.center.fromArray(J.center),this}}var e0=new f,U7=new f,o9=new f,U8=new f,G7=new f,a9=new f,E7=new f;class b9{constructor(J=new f,Q=new f(0,0,-1)){this.origin=J,this.direction=Q}set(J,Q){return this.origin.copy(J),this.direction.copy(Q),this}copy(J){return this.origin.copy(J.origin),this.direction.copy(J.direction),this}at(J,Q){return Q.copy(this.origin).addScaledVector(this.direction,J)}lookAt(J){return this.direction.copy(J).sub(this.origin).normalize(),this}recast(J){return this.origin.copy(this.at(J,e0)),this}closestPointToPoint(J,Q){Q.subVectors(J,this.origin);let $=Q.dot(this.direction);if($<0)return Q.copy(this.origin);return Q.copy(this.origin).addScaledVector(this.direction,$)}distanceToPoint(J){return Math.sqrt(this.distanceSqToPoint(J))}distanceSqToPoint(J){let Q=e0.subVectors(J,this.origin).dot(this.direction);if(Q<0)return this.origin.distanceToSquared(J);return e0.copy(this.origin).addScaledVector(this.direction,Q),e0.distanceToSquared(J)}distanceSqToSegment(J,Q,$,Z){U7.copy(J).add(Q).multiplyScalar(0.5),o9.copy(Q).sub(J).normalize(),U8.copy(this.origin).sub(U7);let W=J.distanceTo(Q)*0.5,K=-this.direction.dot(o9),H=U8.dot(this.direction),Y=-U8.dot(o9),X=U8.lengthSq(),U=Math.abs(1-K*K),E,G,N,O;if(U>0)if(E=K*Y-H,G=K*H-Y,O=W*U,E>=0)if(G>=-O)if(G<=O){let M=1/U;E*=M,G*=M,N=E*(E+K*G+2*H)+G*(K*E+G+2*Y)+X}else G=W,E=Math.max(0,-(K*G+H)),N=-E*E+G*(G+2*Y)+X;else G=-W,E=Math.max(0,-(K*G+H)),N=-E*E+G*(G+2*Y)+X;else if(G<=-O)E=Math.max(0,-(-K*W+H)),G=E>0?-W:Math.min(Math.max(-W,-Y),W),N=-E*E+G*(G+2*Y)+X;else if(G<=O)E=0,G=Math.min(Math.max(-W,-Y),W),N=G*(G+2*Y)+X;else E=Math.max(0,-(K*W+H)),G=E>0?W:Math.min(Math.max(-W,-Y),W),N=-E*E+G*(G+2*Y)+X;else G=K>0?-W:W,E=Math.max(0,-(K*G+H)),N=-E*E+G*(G+2*Y)+X;if($)$.copy(this.origin).addScaledVector(this.direction,E);if(Z)Z.copy(U7).addScaledVector(o9,G);return N}intersectSphere(J,Q){e0.subVectors(J.center,this.origin);let $=e0.dot(this.direction),Z=e0.dot(e0)-$*$,W=J.radius*J.radius;if(Z>W)return null;let K=Math.sqrt(W-Z),H=$-K,Y=$+K;if(Y<0)return null;if(H<0)return this.at(Y,Q);return this.at(H,Q)}intersectsSphere(J){if(J.radius<0)return!1;return this.distanceSqToPoint(J.center)<=J.radius*J.radius}distanceToPlane(J){let Q=J.normal.dot(this.direction);if(Q===0){if(J.distanceToPoint(this.origin)===0)return 0;return null}let $=-(this.origin.dot(J.normal)+J.constant)/Q;return $>=0?$:null}intersectPlane(J,Q){let $=this.distanceToPlane(J);if($===null)return null;return this.at($,Q)}intersectsPlane(J){let Q=J.distanceToPoint(this.origin);if(Q===0)return!0;if(J.normal.dot(this.direction)*Q<0)return!0;return!1}intersectBox(J,Q){let $,Z,W,K,H,Y,X=1/this.direction.x,U=1/this.direction.y,E=1/this.direction.z,G=this.origin;if(X>=0)$=(J.min.x-G.x)*X,Z=(J.max.x-G.x)*X;else $=(J.max.x-G.x)*X,Z=(J.min.x-G.x)*X;if(U>=0)W=(J.min.y-G.y)*U,K=(J.max.y-G.y)*U;else W=(J.max.y-G.y)*U,K=(J.min.y-G.y)*U;if($>K||W>Z)return null;if(W>$||isNaN($))$=W;if(K<Z||isNaN(Z))Z=K;if(E>=0)H=(J.min.z-G.z)*E,Y=(J.max.z-G.z)*E;else H=(J.max.z-G.z)*E,Y=(J.min.z-G.z)*E;if($>Y||H>Z)return null;if(H>$||$!==$)$=H;if(Y<Z||Z!==Z)Z=Y;if(Z<0)return null;return this.at($>=0?$:Z,Q)}intersectsBox(J){return this.intersectBox(J,e0)!==null}intersectTriangle(J,Q,$,Z,W){G7.subVectors(Q,J),a9.subVectors($,J),E7.crossVectors(G7,a9);let K=this.direction.dot(E7),H;if(K>0){if(Z)return null;H=1}else if(K<0)H=-1,K=-K;else return null;U8.subVectors(this.origin,J);let Y=H*this.direction.dot(a9.crossVectors(U8,a9));if(Y<0)return null;let X=H*this.direction.dot(G7.cross(U8));if(X<0)return null;if(Y+X>K)return null;let U=-H*U8.dot(E7);if(U<0)return null;return this.at(U/K,W)}applyMatrix4(J){return this.origin.applyMatrix4(J),this.direction.transformDirection(J),this}equals(J){return J.origin.equals(this.origin)&&J.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class W0{constructor(J,Q,$,Z,W,K,H,Y,X,U,E,G,N,O,M,k){if(W0.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],J!==void 0)this.set(J,Q,$,Z,W,K,H,Y,X,U,E,G,N,O,M,k)}set(J,Q,$,Z,W,K,H,Y,X,U,E,G,N,O,M,k){let q=this.elements;return q[0]=J,q[4]=Q,q[8]=$,q[12]=Z,q[1]=W,q[5]=K,q[9]=H,q[13]=Y,q[2]=X,q[6]=U,q[10]=E,q[14]=G,q[3]=N,q[7]=O,q[11]=M,q[15]=k,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new W0().fromArray(this.elements)}copy(J){let Q=this.elements,$=J.elements;return Q[0]=$[0],Q[1]=$[1],Q[2]=$[2],Q[3]=$[3],Q[4]=$[4],Q[5]=$[5],Q[6]=$[6],Q[7]=$[7],Q[8]=$[8],Q[9]=$[9],Q[10]=$[10],Q[11]=$[11],Q[12]=$[12],Q[13]=$[13],Q[14]=$[14],Q[15]=$[15],this}copyPosition(J){let Q=this.elements,$=J.elements;return Q[12]=$[12],Q[13]=$[13],Q[14]=$[14],this}setFromMatrix3(J){let Q=J.elements;return this.set(Q[0],Q[3],Q[6],0,Q[1],Q[4],Q[7],0,Q[2],Q[5],Q[8],0,0,0,0,1),this}extractBasis(J,Q,$){return J.setFromMatrixColumn(this,0),Q.setFromMatrixColumn(this,1),$.setFromMatrixColumn(this,2),this}makeBasis(J,Q,$){return this.set(J.x,Q.x,$.x,0,J.y,Q.y,$.y,0,J.z,Q.z,$.z,0,0,0,0,1),this}extractRotation(J){let Q=this.elements,$=J.elements,Z=1/i8.setFromMatrixColumn(J,0).length(),W=1/i8.setFromMatrixColumn(J,1).length(),K=1/i8.setFromMatrixColumn(J,2).length();return Q[0]=$[0]*Z,Q[1]=$[1]*Z,Q[2]=$[2]*Z,Q[3]=0,Q[4]=$[4]*W,Q[5]=$[5]*W,Q[6]=$[6]*W,Q[7]=0,Q[8]=$[8]*K,Q[9]=$[9]*K,Q[10]=$[10]*K,Q[11]=0,Q[12]=0,Q[13]=0,Q[14]=0,Q[15]=1,this}makeRotationFromEuler(J){let Q=this.elements,$=J.x,Z=J.y,W=J.z,K=Math.cos($),H=Math.sin($),Y=Math.cos(Z),X=Math.sin(Z),U=Math.cos(W),E=Math.sin(W);if(J.order==="XYZ"){let G=K*U,N=K*E,O=H*U,M=H*E;Q[0]=Y*U,Q[4]=-Y*E,Q[8]=X,Q[1]=N+O*X,Q[5]=G-M*X,Q[9]=-H*Y,Q[2]=M-G*X,Q[6]=O+N*X,Q[10]=K*Y}else if(J.order==="YXZ"){let G=Y*U,N=Y*E,O=X*U,M=X*E;Q[0]=G+M*H,Q[4]=O*H-N,Q[8]=K*X,Q[1]=K*E,Q[5]=K*U,Q[9]=-H,Q[2]=N*H-O,Q[6]=M+G*H,Q[10]=K*Y}else if(J.order==="ZXY"){let G=Y*U,N=Y*E,O=X*U,M=X*E;Q[0]=G-M*H,Q[4]=-K*E,Q[8]=O+N*H,Q[1]=N+O*H,Q[5]=K*U,Q[9]=M-G*H,Q[2]=-K*X,Q[6]=H,Q[10]=K*Y}else if(J.order==="ZYX"){let G=K*U,N=K*E,O=H*U,M=H*E;Q[0]=Y*U,Q[4]=O*X-N,Q[8]=G*X+M,Q[1]=Y*E,Q[5]=M*X+G,Q[9]=N*X-O,Q[2]=-X,Q[6]=H*Y,Q[10]=K*Y}else if(J.order==="YZX"){let G=K*Y,N=K*X,O=H*Y,M=H*X;Q[0]=Y*U,Q[4]=M-G*E,Q[8]=O*E+N,Q[1]=E,Q[5]=K*U,Q[9]=-H*U,Q[2]=-X*U,Q[6]=N*E+O,Q[10]=G-M*E}else if(J.order==="XZY"){let G=K*Y,N=K*X,O=H*Y,M=H*X;Q[0]=Y*U,Q[4]=-E,Q[8]=X*U,Q[1]=G*E+M,Q[5]=K*U,Q[9]=N*E-O,Q[2]=O*E-N,Q[6]=H*U,Q[10]=M*E+G}return Q[3]=0,Q[7]=0,Q[11]=0,Q[12]=0,Q[13]=0,Q[14]=0,Q[15]=1,this}makeRotationFromQuaternion(J){return this.compose(mW,J,dW)}lookAt(J,Q,$){let Z=this.elements;if(P0.subVectors(J,Q),P0.lengthSq()===0)P0.z=1;if(P0.normalize(),G8.crossVectors($,P0),G8.lengthSq()===0){if(Math.abs($.z)===1)P0.x+=0.0001;else P0.z+=0.0001;P0.normalize(),G8.crossVectors($,P0)}return G8.normalize(),r9.crossVectors(P0,G8),Z[0]=G8.x,Z[4]=r9.x,Z[8]=P0.x,Z[1]=G8.y,Z[5]=r9.y,Z[9]=P0.y,Z[2]=G8.z,Z[6]=r9.z,Z[10]=P0.z,this}multiply(J){return this.multiplyMatrices(this,J)}premultiply(J){return this.multiplyMatrices(J,this)}multiplyMatrices(J,Q){let $=J.elements,Z=Q.elements,W=this.elements,K=$[0],H=$[4],Y=$[8],X=$[12],U=$[1],E=$[5],G=$[9],N=$[13],O=$[2],M=$[6],k=$[10],q=$[14],D=$[3],P=$[7],V=$[11],I=$[15],S=Z[0],C=Z[4],A=Z[8],x=Z[12],z=Z[1],L=Z[5],T=Z[9],d=Z[13],c=Z[2],m=Z[6],o=Z[10],l=Z[14],r=Z[3],g=Z[7],KJ=Z[11],GJ=Z[15];return W[0]=K*S+H*z+Y*c+X*r,W[4]=K*C+H*L+Y*m+X*g,W[8]=K*A+H*T+Y*o+X*KJ,W[12]=K*x+H*d+Y*l+X*GJ,W[1]=U*S+E*z+G*c+N*r,W[5]=U*C+E*L+G*m+N*g,W[9]=U*A+E*T+G*o+N*KJ,W[13]=U*x+E*d+G*l+N*GJ,W[2]=O*S+M*z+k*c+q*r,W[6]=O*C+M*L+k*m+q*g,W[10]=O*A+M*T+k*o+q*KJ,W[14]=O*x+M*d+k*l+q*GJ,W[3]=D*S+P*z+V*c+I*r,W[7]=D*C+P*L+V*m+I*g,W[11]=D*A+P*T+V*o+I*KJ,W[15]=D*x+P*d+V*l+I*GJ,this}multiplyScalar(J){let Q=this.elements;return Q[0]*=J,Q[4]*=J,Q[8]*=J,Q[12]*=J,Q[1]*=J,Q[5]*=J,Q[9]*=J,Q[13]*=J,Q[2]*=J,Q[6]*=J,Q[10]*=J,Q[14]*=J,Q[3]*=J,Q[7]*=J,Q[11]*=J,Q[15]*=J,this}determinant(){let J=this.elements,Q=J[0],$=J[4],Z=J[8],W=J[12],K=J[1],H=J[5],Y=J[9],X=J[13],U=J[2],E=J[6],G=J[10],N=J[14],O=J[3],M=J[7],k=J[11],q=J[15];return O*(+W*Y*E-Z*X*E-W*H*G+$*X*G+Z*H*N-$*Y*N)+M*(+Q*Y*N-Q*X*G+W*K*G-Z*K*N+Z*X*U-W*Y*U)+k*(+Q*X*E-Q*H*N-W*K*E+$*K*N+W*H*U-$*X*U)+q*(-Z*H*U-Q*Y*E+Q*H*G+Z*K*E-$*K*G+$*Y*U)}transpose(){let J=this.elements,Q;return Q=J[1],J[1]=J[4],J[4]=Q,Q=J[2],J[2]=J[8],J[8]=Q,Q=J[6],J[6]=J[9],J[9]=Q,Q=J[3],J[3]=J[12],J[12]=Q,Q=J[7],J[7]=J[13],J[13]=Q,Q=J[11],J[11]=J[14],J[14]=Q,this}setPosition(J,Q,$){let Z=this.elements;if(J.isVector3)Z[12]=J.x,Z[13]=J.y,Z[14]=J.z;else Z[12]=J,Z[13]=Q,Z[14]=$;return this}invert(){let J=this.elements,Q=J[0],$=J[1],Z=J[2],W=J[3],K=J[4],H=J[5],Y=J[6],X=J[7],U=J[8],E=J[9],G=J[10],N=J[11],O=J[12],M=J[13],k=J[14],q=J[15],D=E*k*X-M*G*X+M*Y*N-H*k*N-E*Y*q+H*G*q,P=O*G*X-U*k*X-O*Y*N+K*k*N+U*Y*q-K*G*q,V=U*M*X-O*E*X+O*H*N-K*M*N-U*H*q+K*E*q,I=O*E*Y-U*M*Y-O*H*G+K*M*G+U*H*k-K*E*k,S=Q*D+$*P+Z*V+W*I;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/S;return J[0]=D*C,J[1]=(M*G*W-E*k*W-M*Z*N+$*k*N+E*Z*q-$*G*q)*C,J[2]=(H*k*W-M*Y*W+M*Z*X-$*k*X-H*Z*q+$*Y*q)*C,J[3]=(E*Y*W-H*G*W-E*Z*X+$*G*X+H*Z*N-$*Y*N)*C,J[4]=P*C,J[5]=(U*k*W-O*G*W+O*Z*N-Q*k*N-U*Z*q+Q*G*q)*C,J[6]=(O*Y*W-K*k*W-O*Z*X+Q*k*X+K*Z*q-Q*Y*q)*C,J[7]=(K*G*W-U*Y*W+U*Z*X-Q*G*X-K*Z*N+Q*Y*N)*C,J[8]=V*C,J[9]=(O*E*W-U*M*W-O*$*N+Q*M*N+U*$*q-Q*E*q)*C,J[10]=(K*M*W-O*H*W+O*$*X-Q*M*X-K*$*q+Q*H*q)*C,J[11]=(U*H*W-K*E*W-U*$*X+Q*E*X+K*$*N-Q*H*N)*C,J[12]=I*C,J[13]=(U*M*Z-O*E*Z+O*$*G-Q*M*G-U*$*k+Q*E*k)*C,J[14]=(O*H*Z-K*M*Z-O*$*Y+Q*M*Y+K*$*k-Q*H*k)*C,J[15]=(K*E*Z-U*H*Z+U*$*Y-Q*E*Y-K*$*G+Q*H*G)*C,this}scale(J){let Q=this.elements,$=J.x,Z=J.y,W=J.z;return Q[0]*=$,Q[4]*=Z,Q[8]*=W,Q[1]*=$,Q[5]*=Z,Q[9]*=W,Q[2]*=$,Q[6]*=Z,Q[10]*=W,Q[3]*=$,Q[7]*=Z,Q[11]*=W,this}getMaxScaleOnAxis(){let J=this.elements,Q=J[0]*J[0]+J[1]*J[1]+J[2]*J[2],$=J[4]*J[4]+J[5]*J[5]+J[6]*J[6],Z=J[8]*J[8]+J[9]*J[9]+J[10]*J[10];return Math.sqrt(Math.max(Q,$,Z))}makeTranslation(J,Q,$){if(J.isVector3)this.set(1,0,0,J.x,0,1,0,J.y,0,0,1,J.z,0,0,0,1);else this.set(1,0,0,J,0,1,0,Q,0,0,1,$,0,0,0,1);return this}makeRotationX(J){let Q=Math.cos(J),$=Math.sin(J);return this.set(1,0,0,0,0,Q,-$,0,0,$,Q,0,0,0,0,1),this}makeRotationY(J){let Q=Math.cos(J),$=Math.sin(J);return this.set(Q,0,$,0,0,1,0,0,-$,0,Q,0,0,0,0,1),this}makeRotationZ(J){let Q=Math.cos(J),$=Math.sin(J);return this.set(Q,-$,0,0,$,Q,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(J,Q){let $=Math.cos(Q),Z=Math.sin(Q),W=1-$,K=J.x,H=J.y,Y=J.z,X=W*K,U=W*H;return this.set(X*K+$,X*H-Z*Y,X*Y+Z*H,0,X*H+Z*Y,U*H+$,U*Y-Z*K,0,X*Y-Z*H,U*Y+Z*K,W*Y*Y+$,0,0,0,0,1),this}makeScale(J,Q,$){return this.set(J,0,0,0,0,Q,0,0,0,0,$,0,0,0,0,1),this}makeShear(J,Q,$,Z,W,K){return this.set(1,$,W,0,J,1,K,0,Q,Z,1,0,0,0,0,1),this}compose(J,Q,$){let Z=this.elements,W=Q._x,K=Q._y,H=Q._z,Y=Q._w,X=W+W,U=K+K,E=H+H,G=W*X,N=W*U,O=W*E,M=K*U,k=K*E,q=H*E,D=Y*X,P=Y*U,V=Y*E,I=$.x,S=$.y,C=$.z;return Z[0]=(1-(M+q))*I,Z[1]=(N+V)*I,Z[2]=(O-P)*I,Z[3]=0,Z[4]=(N-V)*S,Z[5]=(1-(G+q))*S,Z[6]=(k+D)*S,Z[7]=0,Z[8]=(O+P)*C,Z[9]=(k-D)*C,Z[10]=(1-(G+M))*C,Z[11]=0,Z[12]=J.x,Z[13]=J.y,Z[14]=J.z,Z[15]=1,this}decompose(J,Q,$){let Z=this.elements,W=i8.set(Z[0],Z[1],Z[2]).length(),K=i8.set(Z[4],Z[5],Z[6]).length(),H=i8.set(Z[8],Z[9],Z[10]).length();if(this.determinant()<0)W=-W;J.x=Z[12],J.y=Z[13],J.z=Z[14],p0.copy(this);let X=1/W,U=1/K,E=1/H;return p0.elements[0]*=X,p0.elements[1]*=X,p0.elements[2]*=X,p0.elements[4]*=U,p0.elements[5]*=U,p0.elements[6]*=U,p0.elements[8]*=E,p0.elements[9]*=E,p0.elements[10]*=E,Q.setFromRotationMatrix(p0),$.x=W,$.y=K,$.z=H,this}makePerspective(J,Q,$,Z,W,K,H=2000,Y=!1){let X=this.elements,U=2*W/(Q-J),E=2*W/($-Z),G=(Q+J)/(Q-J),N=($+Z)/($-Z),O,M;if(Y)O=W/(K-W),M=K*W/(K-W);else if(H===2000)O=-(K+W)/(K-W),M=-2*K*W/(K-W);else if(H===2001)O=-K/(K-W),M=-K*W/(K-W);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+H);return X[0]=U,X[4]=0,X[8]=G,X[12]=0,X[1]=0,X[5]=E,X[9]=N,X[13]=0,X[2]=0,X[6]=0,X[10]=O,X[14]=M,X[3]=0,X[7]=0,X[11]=-1,X[15]=0,this}makeOrthographic(J,Q,$,Z,W,K,H=2000,Y=!1){let X=this.elements,U=2/(Q-J),E=2/($-Z),G=-(Q+J)/(Q-J),N=-($+Z)/($-Z),O,M;if(Y)O=1/(K-W),M=K/(K-W);else if(H===2000)O=-2/(K-W),M=-(K+W)/(K-W);else if(H===2001)O=-1/(K-W),M=-W/(K-W);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+H);return X[0]=U,X[4]=0,X[8]=0,X[12]=G,X[1]=0,X[5]=E,X[9]=0,X[13]=N,X[2]=0,X[6]=0,X[10]=O,X[14]=M,X[3]=0,X[7]=0,X[11]=0,X[15]=1,this}equals(J){let Q=this.elements,$=J.elements;for(let Z=0;Z<16;Z++)if(Q[Z]!==$[Z])return!1;return!0}fromArray(J,Q=0){for(let $=0;$<16;$++)this.elements[$]=J[$+Q];return this}toArray(J=[],Q=0){let $=this.elements;return J[Q]=$[0],J[Q+1]=$[1],J[Q+2]=$[2],J[Q+3]=$[3],J[Q+4]=$[4],J[Q+5]=$[5],J[Q+6]=$[6],J[Q+7]=$[7],J[Q+8]=$[8],J[Q+9]=$[9],J[Q+10]=$[10],J[Q+11]=$[11],J[Q+12]=$[12],J[Q+13]=$[13],J[Q+14]=$[14],J[Q+15]=$[15],J}}var i8=new f,p0=new W0,mW=new f(0,0,0),dW=new f(1,1,1),G8=new f,r9=new f,P0=new f,q$=new W0,D$=new M8;class s0{constructor(J=0,Q=0,$=0,Z=s0.DEFAULT_ORDER){this.isEuler=!0,this._x=J,this._y=Q,this._z=$,this._order=Z}get x(){return this._x}set x(J){this._x=J,this._onChangeCallback()}get y(){return this._y}set y(J){this._y=J,this._onChangeCallback()}get z(){return this._z}set z(J){this._z=J,this._onChangeCallback()}get order(){return this._order}set order(J){this._order=J,this._onChangeCallback()}set(J,Q,$,Z=this._order){return this._x=J,this._y=Q,this._z=$,this._order=Z,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(J){return this._x=J._x,this._y=J._y,this._z=J._z,this._order=J._order,this._onChangeCallback(),this}setFromRotationMatrix(J,Q=this._order,$=!0){let Z=J.elements,W=Z[0],K=Z[4],H=Z[8],Y=Z[1],X=Z[5],U=Z[9],E=Z[2],G=Z[6],N=Z[10];switch(Q){case"XYZ":if(this._y=Math.asin(gJ(H,-1,1)),Math.abs(H)<0.9999999)this._x=Math.atan2(-U,N),this._z=Math.atan2(-K,W);else this._x=Math.atan2(G,X),this._z=0;break;case"YXZ":if(this._x=Math.asin(-gJ(U,-1,1)),Math.abs(U)<0.9999999)this._y=Math.atan2(H,N),this._z=Math.atan2(Y,X);else this._y=Math.atan2(-E,W),this._z=0;break;case"ZXY":if(this._x=Math.asin(gJ(G,-1,1)),Math.abs(G)<0.9999999)this._y=Math.atan2(-E,N),this._z=Math.atan2(-K,X);else this._y=0,this._z=Math.atan2(Y,W);break;case"ZYX":if(this._y=Math.asin(-gJ(E,-1,1)),Math.abs(E)<0.9999999)this._x=Math.atan2(G,N),this._z=Math.atan2(Y,W);else this._x=0,this._z=Math.atan2(-K,X);break;case"YZX":if(this._z=Math.asin(gJ(Y,-1,1)),Math.abs(Y)<0.9999999)this._x=Math.atan2(-U,X),this._y=Math.atan2(-E,W);else this._x=0,this._y=Math.atan2(H,N);break;case"XZY":if(this._z=Math.asin(-gJ(K,-1,1)),Math.abs(K)<0.9999999)this._x=Math.atan2(G,X),this._y=Math.atan2(H,W);else this._x=Math.atan2(-U,N),this._y=0;break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+Q)}if(this._order=Q,$===!0)this._onChangeCallback();return this}setFromQuaternion(J,Q,$){return q$.makeRotationFromQuaternion(J),this.setFromRotationMatrix(q$,Q,$)}setFromVector3(J,Q=this._order){return this.set(J.x,J.y,J.z,Q)}reorder(J){return D$.setFromEuler(this),this.setFromQuaternion(D$,J)}equals(J){return J._x===this._x&&J._y===this._y&&J._z===this._z&&J._order===this._order}fromArray(J){if(this._x=J[0],this._y=J[1],this._z=J[2],J[3]!==void 0)this._order=J[3];return this._onChangeCallback(),this}toArray(J=[],Q=0){return J[Q]=this._x,J[Q+1]=this._y,J[Q+2]=this._z,J[Q+3]=this._order,J}_onChange(J){return this._onChangeCallback=J,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}s0.DEFAULT_ORDER="XYZ";class y6{constructor(){this.mask=1}set(J){this.mask=(1<<J|0)>>>0}enable(J){this.mask|=1<<J|0}enableAll(){this.mask=-1}toggle(J){this.mask^=1<<J|0}disable(J){this.mask&=~(1<<J|0)}disableAll(){this.mask=0}test(J){return(this.mask&J.mask)!==0}isEnabled(J){return(this.mask&(1<<J|0))!==0}}var lW=0,O$=new f,o8=new M8,J8=new W0,t9=new f,z9=new f,uW=new f,cW=new M8,R$=new f(1,0,0),F$=new f(0,1,0),M$=new f(0,0,1),k$={type:"added"},nW={type:"removed"},a8={type:"childadded",child:null},N7={type:"childremoved",child:null};class M0 extends F8{constructor(){super();this.isObject3D=!0,Object.defineProperty(this,"id",{value:lW++}),this.uuid=v9(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=M0.DEFAULT_UP.clone();let J=new f,Q=new s0,$=new M8,Z=new f(1,1,1);function W(){$.setFromEuler(Q,!1)}function K(){Q.setFromQuaternion($,void 0,!1)}Q._onChange(W),$._onChange(K),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:J},rotation:{configurable:!0,enumerable:!0,value:Q},quaternion:{configurable:!0,enumerable:!0,value:$},scale:{configurable:!0,enumerable:!0,value:Z},modelViewMatrix:{value:new W0},normalMatrix:{value:new vJ}}),this.matrix=new W0,this.matrixWorld=new W0,this.matrixAutoUpdate=M0.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=M0.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new y6,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(J){if(this.matrixAutoUpdate)this.updateMatrix();this.matrix.premultiply(J),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(J){return this.quaternion.premultiply(J),this}setRotationFromAxisAngle(J,Q){this.quaternion.setFromAxisAngle(J,Q)}setRotationFromEuler(J){this.quaternion.setFromEuler(J,!0)}setRotationFromMatrix(J){this.quaternion.setFromRotationMatrix(J)}setRotationFromQuaternion(J){this.quaternion.copy(J)}rotateOnAxis(J,Q){return o8.setFromAxisAngle(J,Q),this.quaternion.multiply(o8),this}rotateOnWorldAxis(J,Q){return o8.setFromAxisAngle(J,Q),this.quaternion.premultiply(o8),this}rotateX(J){return this.rotateOnAxis(R$,J)}rotateY(J){return this.rotateOnAxis(F$,J)}rotateZ(J){return this.rotateOnAxis(M$,J)}translateOnAxis(J,Q){return O$.copy(J).applyQuaternion(this.quaternion),this.position.add(O$.multiplyScalar(Q)),this}translateX(J){return this.translateOnAxis(R$,J)}translateY(J){return this.translateOnAxis(F$,J)}translateZ(J){return this.translateOnAxis(M$,J)}localToWorld(J){return this.updateWorldMatrix(!0,!1),J.applyMatrix4(this.matrixWorld)}worldToLocal(J){return this.updateWorldMatrix(!0,!1),J.applyMatrix4(J8.copy(this.matrixWorld).invert())}lookAt(J,Q,$){if(J.isVector3)t9.copy(J);else t9.set(J,Q,$);let Z=this.parent;if(this.updateWorldMatrix(!0,!1),z9.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight)J8.lookAt(z9,t9,this.up);else J8.lookAt(t9,z9,this.up);if(this.quaternion.setFromRotationMatrix(J8),Z)J8.extractRotation(Z.matrixWorld),o8.setFromRotationMatrix(J8),this.quaternion.premultiply(o8.invert())}add(J){if(arguments.length>1){for(let Q=0;Q<arguments.length;Q++)this.add(arguments[Q]);return this}if(J===this)return console.error("THREE.Object3D.add: object can't be added as a child of itself.",J),this;if(J&&J.isObject3D)J.removeFromParent(),J.parent=this,this.children.push(J),J.dispatchEvent(k$),a8.child=J,this.dispatchEvent(a8),a8.child=null;else console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",J);return this}remove(J){if(arguments.length>1){for(let $=0;$<arguments.length;$++)this.remove(arguments[$]);return this}let Q=this.children.indexOf(J);if(Q!==-1)J.parent=null,this.children.splice(Q,1),J.dispatchEvent(nW),N7.child=J,this.dispatchEvent(N7),N7.child=null;return this}removeFromParent(){let J=this.parent;if(J!==null)J.remove(this);return this}clear(){return this.remove(...this.children)}attach(J){if(this.updateWorldMatrix(!0,!1),J8.copy(this.matrixWorld).invert(),J.parent!==null)J.parent.updateWorldMatrix(!0,!1),J8.multiply(J.parent.matrixWorld);return J.applyMatrix4(J8),J.removeFromParent(),J.parent=this,this.children.push(J),J.updateWorldMatrix(!1,!0),J.dispatchEvent(k$),a8.child=J,this.dispatchEvent(a8),a8.child=null,this}getObjectById(J){return this.getObjectByProperty("id",J)}getObjectByName(J){return this.getObjectByProperty("name",J)}getObjectByProperty(J,Q){if(this[J]===Q)return this;for(let $=0,Z=this.children.length;$<Z;$++){let K=this.children[$].getObjectByProperty(J,Q);if(K!==void 0)return K}return}getObjectsByProperty(J,Q,$=[]){if(this[J]===Q)$.push(this);let Z=this.children;for(let W=0,K=Z.length;W<K;W++)Z[W].getObjectsByProperty(J,Q,$);return $}getWorldPosition(J){return this.updateWorldMatrix(!0,!1),J.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(J){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(z9,J,uW),J}getWorldScale(J){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(z9,cW,J),J}getWorldDirection(J){this.updateWorldMatrix(!0,!1);let Q=this.matrixWorld.elements;return J.set(Q[8],Q[9],Q[10]).normalize()}raycast(){}traverse(J){J(this);let Q=this.children;for(let $=0,Z=Q.length;$<Z;$++)Q[$].traverse(J)}traverseVisible(J){if(this.visible===!1)return;J(this);let Q=this.children;for(let $=0,Z=Q.length;$<Z;$++)Q[$].traverseVisible(J)}traverseAncestors(J){let Q=this.parent;if(Q!==null)J(Q),Q.traverseAncestors(J)}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(J){if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||J){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,J=!0}let Q=this.children;for(let $=0,Z=Q.length;$<Z;$++)Q[$].updateMatrixWorld(J)}updateWorldMatrix(J,Q){let $=this.parent;if(J===!0&&$!==null)$.updateWorldMatrix(!0,!1);if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);if(Q===!0){let Z=this.children;for(let W=0,K=Z.length;W<K;W++)Z[W].updateWorldMatrix(!1,!0)}}toJSON(J){let Q=J===void 0||typeof J==="string",$={};if(Q)J={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},$.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"};let Z={};if(Z.uuid=this.uuid,Z.type=this.type,this.name!=="")Z.name=this.name;if(this.castShadow===!0)Z.castShadow=!0;if(this.receiveShadow===!0)Z.receiveShadow=!0;if(this.visible===!1)Z.visible=!1;if(this.frustumCulled===!1)Z.frustumCulled=!1;if(this.renderOrder!==0)Z.renderOrder=this.renderOrder;if(Object.keys(this.userData).length>0)Z.userData=this.userData;if(Z.layers=this.layers.mask,Z.matrix=this.matrix.toArray(),Z.up=this.up.toArray(),this.matrixAutoUpdate===!1)Z.matrixAutoUpdate=!1;if(this.isInstancedMesh){if(Z.type="InstancedMesh",Z.count=this.count,Z.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null)Z.instanceColor=this.instanceColor.toJSON()}if(this.isBatchedMesh){if(Z.type="BatchedMesh",Z.perObjectFrustumCulled=this.perObjectFrustumCulled,Z.sortObjects=this.sortObjects,Z.drawRanges=this._drawRanges,Z.reservedRanges=this._reservedRanges,Z.geometryInfo=this._geometryInfo.map((H)=>({...H,boundingBox:H.boundingBox?H.boundingBox.toJSON():void 0,boundingSphere:H.boundingSphere?H.boundingSphere.toJSON():void 0})),Z.instanceInfo=this._instanceInfo.map((H)=>({...H})),Z.availableInstanceIds=this._availableInstanceIds.slice(),Z.availableGeometryIds=this._availableGeometryIds.slice(),Z.nextIndexStart=this._nextIndexStart,Z.nextVertexStart=this._nextVertexStart,Z.geometryCount=this._geometryCount,Z.maxInstanceCount=this._maxInstanceCount,Z.maxVertexCount=this._maxVertexCount,Z.maxIndexCount=this._maxIndexCount,Z.geometryInitialized=this._geometryInitialized,Z.matricesTexture=this._matricesTexture.toJSON(J),Z.indirectTexture=this._indirectTexture.toJSON(J),this._colorsTexture!==null)Z.colorsTexture=this._colorsTexture.toJSON(J);if(this.boundingSphere!==null)Z.boundingSphere=this.boundingSphere.toJSON();if(this.boundingBox!==null)Z.boundingBox=this.boundingBox.toJSON()}function W(H,Y){if(H[Y.uuid]===void 0)H[Y.uuid]=Y.toJSON(J);return Y.uuid}if(this.isScene){if(this.background){if(this.background.isColor)Z.background=this.background.toJSON();else if(this.background.isTexture)Z.background=this.background.toJSON(J).uuid}if(this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0)Z.environment=this.environment.toJSON(J).uuid}else if(this.isMesh||this.isLine||this.isPoints){Z.geometry=W(J.geometries,this.geometry);let H=this.geometry.parameters;if(H!==void 0&&H.shapes!==void 0){let Y=H.shapes;if(Array.isArray(Y))for(let X=0,U=Y.length;X<U;X++){let E=Y[X];W(J.shapes,E)}else W(J.shapes,Y)}}if(this.isSkinnedMesh){if(Z.bindMode=this.bindMode,Z.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0)W(J.skeletons,this.skeleton),Z.skeleton=this.skeleton.uuid}if(this.material!==void 0)if(Array.isArray(this.material)){let H=[];for(let Y=0,X=this.material.length;Y<X;Y++)H.push(W(J.materials,this.material[Y]));Z.material=H}else Z.material=W(J.materials,this.material);if(this.children.length>0){Z.children=[];for(let H=0;H<this.children.length;H++)Z.children.push(this.children[H].toJSON(J).object)}if(this.animations.length>0){Z.animations=[];for(let H=0;H<this.animations.length;H++){let Y=this.animations[H];Z.animations.push(W(J.animations,Y))}}if(Q){let H=K(J.geometries),Y=K(J.materials),X=K(J.textures),U=K(J.images),E=K(J.shapes),G=K(J.skeletons),N=K(J.animations),O=K(J.nodes);if(H.length>0)$.geometries=H;if(Y.length>0)$.materials=Y;if(X.length>0)$.textures=X;if(U.length>0)$.images=U;if(E.length>0)$.shapes=E;if(G.length>0)$.skeletons=G;if(N.length>0)$.animations=N;if(O.length>0)$.nodes=O}return $.object=Z,$;function K(H){let Y=[];for(let X in H){let U=H[X];delete U.metadata,Y.push(U)}return Y}}clone(J){return new this.constructor().copy(this,J)}copy(J,Q=!0){if(this.name=J.name,this.up.copy(J.up),this.position.copy(J.position),this.rotation.order=J.rotation.order,this.quaternion.copy(J.quaternion),this.scale.copy(J.scale),this.matrix.copy(J.matrix),this.matrixWorld.copy(J.matrixWorld),this.matrixAutoUpdate=J.matrixAutoUpdate,this.matrixWorldAutoUpdate=J.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=J.matrixWorldNeedsUpdate,this.layers.mask=J.layers.mask,this.visible=J.visible,this.castShadow=J.castShadow,this.receiveShadow=J.receiveShadow,this.frustumCulled=J.frustumCulled,this.renderOrder=J.renderOrder,this.animations=J.animations.slice(),this.userData=JSON.parse(JSON.stringify(J.userData)),Q===!0)for(let $=0;$<J.children.length;$++){let Z=J.children[$];this.add(Z.clone())}return this}}M0.DEFAULT_UP=new f(0,1,0);M0.DEFAULT_MATRIX_AUTO_UPDATE=!0;M0.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var m0=new f,Q8=new f,q7=new f,$8=new f,r8=new f,t8=new f,V$=new f,D7=new f,O7=new f,R7=new f,F7=new K0,M7=new K0,k7=new K0;class b0{constructor(J=new f,Q=new f,$=new f){this.a=J,this.b=Q,this.c=$}static getNormal(J,Q,$,Z){Z.subVectors($,Q),m0.subVectors(J,Q),Z.cross(m0);let W=Z.lengthSq();if(W>0)return Z.multiplyScalar(1/Math.sqrt(W));return Z.set(0,0,0)}static getBarycoord(J,Q,$,Z,W){m0.subVectors(Z,Q),Q8.subVectors($,Q),q7.subVectors(J,Q);let K=m0.dot(m0),H=m0.dot(Q8),Y=m0.dot(q7),X=Q8.dot(Q8),U=Q8.dot(q7),E=K*X-H*H;if(E===0)return W.set(0,0,0),null;let G=1/E,N=(X*Y-H*U)*G,O=(K*U-H*Y)*G;return W.set(1-N-O,O,N)}static containsPoint(J,Q,$,Z){if(this.getBarycoord(J,Q,$,Z,$8)===null)return!1;return $8.x>=0&&$8.y>=0&&$8.x+$8.y<=1}static getInterpolation(J,Q,$,Z,W,K,H,Y){if(this.getBarycoord(J,Q,$,Z,$8)===null){if(Y.x=0,Y.y=0,"z"in Y)Y.z=0;if("w"in Y)Y.w=0;return null}return Y.setScalar(0),Y.addScaledVector(W,$8.x),Y.addScaledVector(K,$8.y),Y.addScaledVector(H,$8.z),Y}static getInterpolatedAttribute(J,Q,$,Z,W,K){return F7.setScalar(0),M7.setScalar(0),k7.setScalar(0),F7.fromBufferAttribute(J,Q),M7.fromBufferAttribute(J,$),k7.fromBufferAttribute(J,Z),K.setScalar(0),K.addScaledVector(F7,W.x),K.addScaledVector(M7,W.y),K.addScaledVector(k7,W.z),K}static isFrontFacing(J,Q,$,Z){return m0.subVectors($,Q),Q8.subVectors(J,Q),m0.cross(Q8).dot(Z)<0?!0:!1}set(J,Q,$){return this.a.copy(J),this.b.copy(Q),this.c.copy($),this}setFromPointsAndIndices(J,Q,$,Z){return this.a.copy(J[Q]),this.b.copy(J[$]),this.c.copy(J[Z]),this}setFromAttributeAndIndices(J,Q,$,Z){return this.a.fromBufferAttribute(J,Q),this.b.fromBufferAttribute(J,$),this.c.fromBufferAttribute(J,Z),this}clone(){return new this.constructor().copy(this)}copy(J){return this.a.copy(J.a),this.b.copy(J.b),this.c.copy(J.c),this}getArea(){return m0.subVectors(this.c,this.b),Q8.subVectors(this.a,this.b),m0.cross(Q8).length()*0.5}getMidpoint(J){return J.addVectors(this.a,this.b).add(this.c).multiplyScalar(0.3333333333333333)}getNormal(J){return b0.getNormal(this.a,this.b,this.c,J)}getPlane(J){return J.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(J,Q){return b0.getBarycoord(J,this.a,this.b,this.c,Q)}getInterpolation(J,Q,$,Z,W){return b0.getInterpolation(J,this.a,this.b,this.c,Q,$,Z,W)}containsPoint(J){return b0.containsPoint(J,this.a,this.b,this.c)}isFrontFacing(J){return b0.isFrontFacing(this.a,this.b,this.c,J)}intersectsBox(J){return J.intersectsTriangle(this)}closestPointToPoint(J,Q){let $=this.a,Z=this.b,W=this.c,K,H;r8.subVectors(Z,$),t8.subVectors(W,$),D7.subVectors(J,$);let Y=r8.dot(D7),X=t8.dot(D7);if(Y<=0&&X<=0)return Q.copy($);O7.subVectors(J,Z);let U=r8.dot(O7),E=t8.dot(O7);if(U>=0&&E<=U)return Q.copy(Z);let G=Y*E-U*X;if(G<=0&&Y>=0&&U<=0)return K=Y/(Y-U),Q.copy($).addScaledVector(r8,K);R7.subVectors(J,W);let N=r8.dot(R7),O=t8.dot(R7);if(O>=0&&N<=O)return Q.copy(W);let M=N*X-Y*O;if(M<=0&&X>=0&&O<=0)return H=X/(X-O),Q.copy($).addScaledVector(t8,H);let k=U*O-N*E;if(k<=0&&E-U>=0&&N-O>=0)return V$.subVectors(W,Z),H=(E-U)/(E-U+(N-O)),Q.copy(Z).addScaledVector(V$,H);let q=1/(k+M+G);return K=M*q,H=G*q,Q.copy($).addScaledVector(r8,K).addScaledVector(t8,H)}equals(J){return J.a.equals(this.a)&&J.b.equals(this.b)&&J.c.equals(this.c)}}var hZ={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},E8={h:0,s:0,l:0},e9={h:0,s:0,l:0};function V7(J,Q,$){if($<0)$+=1;if($>1)$-=1;if($<0.16666666666666666)return J+(Q-J)*6*$;if($<0.5)return Q;if($<0.6666666666666666)return J+(Q-J)*6*(0.6666666666666666-$);return J}class lJ{constructor(J,Q,$){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(J,Q,$)}set(J,Q,$){if(Q===void 0&&$===void 0){let Z=J;if(Z&&Z.isColor)this.copy(Z);else if(typeof Z==="number")this.setHex(Z);else if(typeof Z==="string")this.setStyle(Z)}else this.setRGB(J,Q,$);return this}setScalar(J){return this.r=J,this.g=J,this.b=J,this}setHex(J,Q="srgb"){return J=Math.floor(J),this.r=(J>>16&255)/255,this.g=(J>>8&255)/255,this.b=(J&255)/255,pJ.colorSpaceToWorking(this,Q),this}setRGB(J,Q,$,Z=pJ.workingColorSpace){return this.r=J,this.g=Q,this.b=$,pJ.colorSpaceToWorking(this,Z),this}setHSL(J,Q,$,Z=pJ.workingColorSpace){if(J=bW(J,1),Q=gJ(Q,0,1),$=gJ($,0,1),Q===0)this.r=this.g=this.b=$;else{let W=$<=0.5?$*(1+Q):$+Q-$*Q,K=2*$-W;this.r=V7(K,W,J+0.3333333333333333),this.g=V7(K,W,J),this.b=V7(K,W,J-0.3333333333333333)}return pJ.colorSpaceToWorking(this,Z),this}setStyle(J,Q="srgb"){function $(W){if(W===void 0)return;if(parseFloat(W)<1)console.warn("THREE.Color: Alpha component of "+J+" will be ignored.")}let Z;if(Z=/^(\w+)\(([^\)]*)\)/.exec(J)){let W,K=Z[1],H=Z[2];switch(K){case"rgb":case"rgba":if(W=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(H))return $(W[4]),this.setRGB(Math.min(255,parseInt(W[1],10))/255,Math.min(255,parseInt(W[2],10))/255,Math.min(255,parseInt(W[3],10))/255,Q);if(W=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(H))return $(W[4]),this.setRGB(Math.min(100,parseInt(W[1],10))/100,Math.min(100,parseInt(W[2],10))/100,Math.min(100,parseInt(W[3],10))/100,Q);break;case"hsl":case"hsla":if(W=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(H))return $(W[4]),this.setHSL(parseFloat(W[1])/360,parseFloat(W[2])/100,parseFloat(W[3])/100,Q);break;default:console.warn("THREE.Color: Unknown color model "+J)}}else if(Z=/^\#([A-Fa-f\d]+)$/.exec(J)){let W=Z[1],K=W.length;if(K===3)return this.setRGB(parseInt(W.charAt(0),16)/15,parseInt(W.charAt(1),16)/15,parseInt(W.charAt(2),16)/15,Q);else if(K===6)return this.setHex(parseInt(W,16),Q);else console.warn("THREE.Color: Invalid hex color "+J)}else if(J&&J.length>0)return this.setColorName(J,Q);return this}setColorName(J,Q="srgb"){let $=hZ[J.toLowerCase()];if($!==void 0)this.setHex($,Q);else console.warn("THREE.Color: Unknown color "+J);return this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(J){return this.r=J.r,this.g=J.g,this.b=J.b,this}copySRGBToLinear(J){return this.r=W8(J.r),this.g=W8(J.g),this.b=W8(J.b),this}copyLinearToSRGB(J){return this.r=$9(J.r),this.g=$9(J.g),this.b=$9(J.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(J="srgb"){return pJ.workingToColorSpace(F0.copy(this),J),Math.round(gJ(F0.r*255,0,255))*65536+Math.round(gJ(F0.g*255,0,255))*256+Math.round(gJ(F0.b*255,0,255))}getHexString(J="srgb"){return("000000"+this.getHex(J).toString(16)).slice(-6)}getHSL(J,Q=pJ.workingColorSpace){pJ.workingToColorSpace(F0.copy(this),Q);let{r:$,g:Z,b:W}=F0,K=Math.max($,Z,W),H=Math.min($,Z,W),Y,X,U=(H+K)/2;if(H===K)Y=0,X=0;else{let E=K-H;switch(X=U<=0.5?E/(K+H):E/(2-K-H),K){case $:Y=(Z-W)/E+(Z<W?6:0);break;case Z:Y=(W-$)/E+2;break;case W:Y=($-Z)/E+4;break}Y/=6}return J.h=Y,J.s=X,J.l=U,J}getRGB(J,Q=pJ.workingColorSpace){return pJ.workingToColorSpace(F0.copy(this),Q),J.r=F0.r,J.g=F0.g,J.b=F0.b,J}getStyle(J="srgb"){pJ.workingToColorSpace(F0.copy(this),J);let{r:Q,g:$,b:Z}=F0;if(J!=="srgb")return`color(${J} ${Q.toFixed(3)} ${$.toFixed(3)} ${Z.toFixed(3)})`;return`rgb(${Math.round(Q*255)},${Math.round($*255)},${Math.round(Z*255)})`}offsetHSL(J,Q,$){return this.getHSL(E8),this.setHSL(E8.h+J,E8.s+Q,E8.l+$)}add(J){return this.r+=J.r,this.g+=J.g,this.b+=J.b,this}addColors(J,Q){return this.r=J.r+Q.r,this.g=J.g+Q.g,this.b=J.b+Q.b,this}addScalar(J){return this.r+=J,this.g+=J,this.b+=J,this}sub(J){return this.r=Math.max(0,this.r-J.r),this.g=Math.max(0,this.g-J.g),this.b=Math.max(0,this.b-J.b),this}multiply(J){return this.r*=J.r,this.g*=J.g,this.b*=J.b,this}multiplyScalar(J){return this.r*=J,this.g*=J,this.b*=J,this}lerp(J,Q){return this.r+=(J.r-this.r)*Q,this.g+=(J.g-this.g)*Q,this.b+=(J.b-this.b)*Q,this}lerpColors(J,Q,$){return this.r=J.r+(Q.r-J.r)*$,this.g=J.g+(Q.g-J.g)*$,this.b=J.b+(Q.b-J.b)*$,this}lerpHSL(J,Q){this.getHSL(E8),J.getHSL(e9);let $=$7(E8.h,e9.h,Q),Z=$7(E8.s,e9.s,Q),W=$7(E8.l,e9.l,Q);return this.setHSL($,Z,W),this}setFromVector3(J){return this.r=J.x,this.g=J.y,this.b=J.z,this}applyMatrix3(J){let Q=this.r,$=this.g,Z=this.b,W=J.elements;return this.r=W[0]*Q+W[3]*$+W[6]*Z,this.g=W[1]*Q+W[4]*$+W[7]*Z,this.b=W[2]*Q+W[5]*$+W[8]*Z,this}equals(J){return J.r===this.r&&J.g===this.g&&J.b===this.b}fromArray(J,Q=0){return this.r=J[Q],this.g=J[Q+1],this.b=J[Q+2],this}toArray(J=[],Q=0){return J[Q]=this.r,J[Q+1]=this.g,J[Q+2]=this.b,J}fromBufferAttribute(J,Q){return this.r=J.getX(Q),this.g=J.getY(Q),this.b=J.getZ(Q),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}var F0=new lJ;lJ.NAMES=hZ;var sW=0;class k8 extends F8{constructor(){super();this.isMaterial=!0,Object.defineProperty(this,"id",{value:sW++}),this.uuid=v9(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new lJ(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(J){if(this._alphaTest>0!==J>0)this.version++;this._alphaTest=J}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(J){if(J===void 0)return;for(let Q in J){let $=J[Q];if($===void 0){console.warn(`THREE.Material: parameter '${Q}' has value of undefined.`);continue}let Z=this[Q];if(Z===void 0){console.warn(`THREE.Material: '${Q}' is not a property of THREE.${this.type}.`);continue}if(Z&&Z.isColor)Z.set($);else if(Z&&Z.isVector3&&($&&$.isVector3))Z.copy($);else this[Q]=$}}toJSON(J){let Q=J===void 0||typeof J==="string";if(Q)J={textures:{},images:{}};let $={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};if($.uuid=this.uuid,$.type=this.type,this.name!=="")$.name=this.name;if(this.color&&this.color.isColor)$.color=this.color.getHex();if(this.roughness!==void 0)$.roughness=this.roughness;if(this.metalness!==void 0)$.metalness=this.metalness;if(this.sheen!==void 0)$.sheen=this.sheen;if(this.sheenColor&&this.sheenColor.isColor)$.sheenColor=this.sheenColor.getHex();if(this.sheenRoughness!==void 0)$.sheenRoughness=this.sheenRoughness;if(this.emissive&&this.emissive.isColor)$.emissive=this.emissive.getHex();if(this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1)$.emissiveIntensity=this.emissiveIntensity;if(this.specular&&this.specular.isColor)$.specular=this.specular.getHex();if(this.specularIntensity!==void 0)$.specularIntensity=this.specularIntensity;if(this.specularColor&&this.specularColor.isColor)$.specularColor=this.specularColor.getHex();if(this.shininess!==void 0)$.shininess=this.shininess;if(this.clearcoat!==void 0)$.clearcoat=this.clearcoat;if(this.clearcoatRoughness!==void 0)$.clearcoatRoughness=this.clearcoatRoughness;if(this.clearcoatMap&&this.clearcoatMap.isTexture)$.clearcoatMap=this.clearcoatMap.toJSON(J).uuid;if(this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture)$.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(J).uuid;if(this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture)$.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(J).uuid,$.clearcoatNormalScale=this.clearcoatNormalScale.toArray();if(this.sheenColorMap&&this.sheenColorMap.isTexture)$.sheenColorMap=this.sheenColorMap.toJSON(J).uuid;if(this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture)$.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(J).uuid;if(this.dispersion!==void 0)$.dispersion=this.dispersion;if(this.iridescence!==void 0)$.iridescence=this.iridescence;if(this.iridescenceIOR!==void 0)$.iridescenceIOR=this.iridescenceIOR;if(this.iridescenceThicknessRange!==void 0)$.iridescenceThicknessRange=this.iridescenceThicknessRange;if(this.iridescenceMap&&this.iridescenceMap.isTexture)$.iridescenceMap=this.iridescenceMap.toJSON(J).uuid;if(this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture)$.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(J).uuid;if(this.anisotropy!==void 0)$.anisotropy=this.anisotropy;if(this.anisotropyRotation!==void 0)$.anisotropyRotation=this.anisotropyRotation;if(this.anisotropyMap&&this.anisotropyMap.isTexture)$.anisotropyMap=this.anisotropyMap.toJSON(J).uuid;if(this.map&&this.map.isTexture)$.map=this.map.toJSON(J).uuid;if(this.matcap&&this.matcap.isTexture)$.matcap=this.matcap.toJSON(J).uuid;if(this.alphaMap&&this.alphaMap.isTexture)$.alphaMap=this.alphaMap.toJSON(J).uuid;if(this.lightMap&&this.lightMap.isTexture)$.lightMap=this.lightMap.toJSON(J).uuid,$.lightMapIntensity=this.lightMapIntensity;if(this.aoMap&&this.aoMap.isTexture)$.aoMap=this.aoMap.toJSON(J).uuid,$.aoMapIntensity=this.aoMapIntensity;if(this.bumpMap&&this.bumpMap.isTexture)$.bumpMap=this.bumpMap.toJSON(J).uuid,$.bumpScale=this.bumpScale;if(this.normalMap&&this.normalMap.isTexture)$.normalMap=this.normalMap.toJSON(J).uuid,$.normalMapType=this.normalMapType,$.normalScale=this.normalScale.toArray();if(this.displacementMap&&this.displacementMap.isTexture)$.displacementMap=this.displacementMap.toJSON(J).uuid,$.displacementScale=this.displacementScale,$.displacementBias=this.displacementBias;if(this.roughnessMap&&this.roughnessMap.isTexture)$.roughnessMap=this.roughnessMap.toJSON(J).uuid;if(this.metalnessMap&&this.metalnessMap.isTexture)$.metalnessMap=this.metalnessMap.toJSON(J).uuid;if(this.emissiveMap&&this.emissiveMap.isTexture)$.emissiveMap=this.emissiveMap.toJSON(J).uuid;if(this.specularMap&&this.specularMap.isTexture)$.specularMap=this.specularMap.toJSON(J).uuid;if(this.specularIntensityMap&&this.specularIntensityMap.isTexture)$.specularIntensityMap=this.specularIntensityMap.toJSON(J).uuid;if(this.specularColorMap&&this.specularColorMap.isTexture)$.specularColorMap=this.specularColorMap.toJSON(J).uuid;if(this.envMap&&this.envMap.isTexture){if($.envMap=this.envMap.toJSON(J).uuid,this.combine!==void 0)$.combine=this.combine}if(this.envMapRotation!==void 0)$.envMapRotation=this.envMapRotation.toArray();if(this.envMapIntensity!==void 0)$.envMapIntensity=this.envMapIntensity;if(this.reflectivity!==void 0)$.reflectivity=this.reflectivity;if(this.refractionRatio!==void 0)$.refractionRatio=this.refractionRatio;if(this.gradientMap&&this.gradientMap.isTexture)$.gradientMap=this.gradientMap.toJSON(J).uuid;if(this.transmission!==void 0)$.transmission=this.transmission;if(this.transmissionMap&&this.transmissionMap.isTexture)$.transmissionMap=this.transmissionMap.toJSON(J).uuid;if(this.thickness!==void 0)$.thickness=this.thickness;if(this.thicknessMap&&this.thicknessMap.isTexture)$.thicknessMap=this.thicknessMap.toJSON(J).uuid;if(this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0)$.attenuationDistance=this.attenuationDistance;if(this.attenuationColor!==void 0)$.attenuationColor=this.attenuationColor.getHex();if(this.size!==void 0)$.size=this.size;if(this.shadowSide!==null)$.shadowSide=this.shadowSide;if(this.sizeAttenuation!==void 0)$.sizeAttenuation=this.sizeAttenuation;if(this.blending!==1)$.blending=this.blending;if(this.side!==0)$.side=this.side;if(this.vertexColors===!0)$.vertexColors=!0;if(this.opacity<1)$.opacity=this.opacity;if(this.transparent===!0)$.transparent=!0;if(this.blendSrc!==204)$.blendSrc=this.blendSrc;if(this.blendDst!==205)$.blendDst=this.blendDst;if(this.blendEquation!==100)$.blendEquation=this.blendEquation;if(this.blendSrcAlpha!==null)$.blendSrcAlpha=this.blendSrcAlpha;if(this.blendDstAlpha!==null)$.blendDstAlpha=this.blendDstAlpha;if(this.blendEquationAlpha!==null)$.blendEquationAlpha=this.blendEquationAlpha;if(this.blendColor&&this.blendColor.isColor)$.blendColor=this.blendColor.getHex();if(this.blendAlpha!==0)$.blendAlpha=this.blendAlpha;if(this.depthFunc!==3)$.depthFunc=this.depthFunc;if(this.depthTest===!1)$.depthTest=this.depthTest;if(this.depthWrite===!1)$.depthWrite=this.depthWrite;if(this.colorWrite===!1)$.colorWrite=this.colorWrite;if(this.stencilWriteMask!==255)$.stencilWriteMask=this.stencilWriteMask;if(this.stencilFunc!==519)$.stencilFunc=this.stencilFunc;if(this.stencilRef!==0)$.stencilRef=this.stencilRef;if(this.stencilFuncMask!==255)$.stencilFuncMask=this.stencilFuncMask;if(this.stencilFail!==7680)$.stencilFail=this.stencilFail;if(this.stencilZFail!==7680)$.stencilZFail=this.stencilZFail;if(this.stencilZPass!==7680)$.stencilZPass=this.stencilZPass;if(this.stencilWrite===!0)$.stencilWrite=this.stencilWrite;if(this.rotation!==void 0&&this.rotation!==0)$.rotation=this.rotation;if(this.polygonOffset===!0)$.polygonOffset=!0;if(this.polygonOffsetFactor!==0)$.polygonOffsetFactor=this.polygonOffsetFactor;if(this.polygonOffsetUnits!==0)$.polygonOffsetUnits=this.polygonOffsetUnits;if(this.linewidth!==void 0&&this.linewidth!==1)$.linewidth=this.linewidth;if(this.dashSize!==void 0)$.dashSize=this.dashSize;if(this.gapSize!==void 0)$.gapSize=this.gapSize;if(this.scale!==void 0)$.scale=this.scale;if(this.dithering===!0)$.dithering=!0;if(this.alphaTest>0)$.alphaTest=this.alphaTest;if(this.alphaHash===!0)$.alphaHash=!0;if(this.alphaToCoverage===!0)$.alphaToCoverage=!0;if(this.premultipliedAlpha===!0)$.premultipliedAlpha=!0;if(this.forceSinglePass===!0)$.forceSinglePass=!0;if(this.wireframe===!0)$.wireframe=!0;if(this.wireframeLinewidth>1)$.wireframeLinewidth=this.wireframeLinewidth;if(this.wireframeLinecap!=="round")$.wireframeLinecap=this.wireframeLinecap;if(this.wireframeLinejoin!=="round")$.wireframeLinejoin=this.wireframeLinejoin;if(this.flatShading===!0)$.flatShading=!0;if(this.visible===!1)$.visible=!1;if(this.toneMapped===!1)$.toneMapped=!1;if(this.fog===!1)$.fog=!1;if(Object.keys(this.userData).length>0)$.userData=this.userData;function Z(W){let K=[];for(let H in W){let Y=W[H];delete Y.metadata,K.push(Y)}return K}if(Q){let W=Z(J.textures),K=Z(J.images);if(W.length>0)$.textures=W;if(K.length>0)$.images=K}return $}clone(){return new this.constructor().copy(this)}copy(J){this.name=J.name,this.blending=J.blending,this.side=J.side,this.vertexColors=J.vertexColors,this.opacity=J.opacity,this.transparent=J.transparent,this.blendSrc=J.blendSrc,this.blendDst=J.blendDst,this.blendEquation=J.blendEquation,this.blendSrcAlpha=J.blendSrcAlpha,this.blendDstAlpha=J.blendDstAlpha,this.blendEquationAlpha=J.blendEquationAlpha,this.blendColor.copy(J.blendColor),this.blendAlpha=J.blendAlpha,this.depthFunc=J.depthFunc,this.depthTest=J.depthTest,this.depthWrite=J.depthWrite,this.stencilWriteMask=J.stencilWriteMask,this.stencilFunc=J.stencilFunc,this.stencilRef=J.stencilRef,this.stencilFuncMask=J.stencilFuncMask,this.stencilFail=J.stencilFail,this.stencilZFail=J.stencilZFail,this.stencilZPass=J.stencilZPass,this.stencilWrite=J.stencilWrite;let Q=J.clippingPlanes,$=null;if(Q!==null){let Z=Q.length;$=new Array(Z);for(let W=0;W!==Z;++W)$[W]=Q[W].clone()}return this.clippingPlanes=$,this.clipIntersection=J.clipIntersection,this.clipShadows=J.clipShadows,this.shadowSide=J.shadowSide,this.colorWrite=J.colorWrite,this.precision=J.precision,this.polygonOffset=J.polygonOffset,this.polygonOffsetFactor=J.polygonOffsetFactor,this.polygonOffsetUnits=J.polygonOffsetUnits,this.dithering=J.dithering,this.alphaTest=J.alphaTest,this.alphaHash=J.alphaHash,this.alphaToCoverage=J.alphaToCoverage,this.premultipliedAlpha=J.premultipliedAlpha,this.forceSinglePass=J.forceSinglePass,this.visible=J.visible,this.toneMapped=J.toneMapped,this.userData=JSON.parse(JSON.stringify(J.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(J){if(J===!0)this.version++}}class v6 extends k8{constructor(J){super();this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new lJ(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new s0,this.combine=0,this.reflectivity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.lightMap=J.lightMap,this.lightMapIntensity=J.lightMapIntensity,this.aoMap=J.aoMap,this.aoMapIntensity=J.aoMapIntensity,this.specularMap=J.specularMap,this.alphaMap=J.alphaMap,this.envMap=J.envMap,this.envMapRotation.copy(J.envMapRotation),this.combine=J.combine,this.reflectivity=J.reflectivity,this.refractionRatio=J.refractionRatio,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.wireframeLinecap=J.wireframeLinecap,this.wireframeLinejoin=J.wireframeLinejoin,this.fog=J.fog,this}}var X0=new f,J6=new cJ,iW=0;class aJ{constructor(J,Q,$=!1){if(Array.isArray(J))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:iW++}),this.name="",this.array=J,this.itemSize=Q,this.count=J!==void 0?J.length/Q:0,this.normalized=$,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(J){if(J===!0)this.version++}setUsage(J){return this.usage=J,this}addUpdateRange(J,Q){this.updateRanges.push({start:J,count:Q})}clearUpdateRanges(){this.updateRanges.length=0}copy(J){return this.name=J.name,this.array=new J.array.constructor(J.array),this.itemSize=J.itemSize,this.count=J.count,this.normalized=J.normalized,this.usage=J.usage,this.gpuType=J.gpuType,this}copyAt(J,Q,$){J*=this.itemSize,$*=Q.itemSize;for(let Z=0,W=this.itemSize;Z<W;Z++)this.array[J+Z]=Q.array[$+Z];return this}copyArray(J){return this.array.set(J),this}applyMatrix3(J){if(this.itemSize===2)for(let Q=0,$=this.count;Q<$;Q++)J6.fromBufferAttribute(this,Q),J6.applyMatrix3(J),this.setXY(Q,J6.x,J6.y);else if(this.itemSize===3)for(let Q=0,$=this.count;Q<$;Q++)X0.fromBufferAttribute(this,Q),X0.applyMatrix3(J),this.setXYZ(Q,X0.x,X0.y,X0.z);return this}applyMatrix4(J){for(let Q=0,$=this.count;Q<$;Q++)X0.fromBufferAttribute(this,Q),X0.applyMatrix4(J),this.setXYZ(Q,X0.x,X0.y,X0.z);return this}applyNormalMatrix(J){for(let Q=0,$=this.count;Q<$;Q++)X0.fromBufferAttribute(this,Q),X0.applyNormalMatrix(J),this.setXYZ(Q,X0.x,X0.y,X0.z);return this}transformDirection(J){for(let Q=0,$=this.count;Q<$;Q++)X0.fromBufferAttribute(this,Q),X0.transformDirection(J),this.setXYZ(Q,X0.x,X0.y,X0.z);return this}set(J,Q=0){return this.array.set(J,Q),this}getComponent(J,Q){let $=this.array[J*this.itemSize+Q];if(this.normalized)$=k9($,this.array);return $}setComponent(J,Q,$){if(this.normalized)$=I0($,this.array);return this.array[J*this.itemSize+Q]=$,this}getX(J){let Q=this.array[J*this.itemSize];if(this.normalized)Q=k9(Q,this.array);return Q}setX(J,Q){if(this.normalized)Q=I0(Q,this.array);return this.array[J*this.itemSize]=Q,this}getY(J){let Q=this.array[J*this.itemSize+1];if(this.normalized)Q=k9(Q,this.array);return Q}setY(J,Q){if(this.normalized)Q=I0(Q,this.array);return this.array[J*this.itemSize+1]=Q,this}getZ(J){let Q=this.array[J*this.itemSize+2];if(this.normalized)Q=k9(Q,this.array);return Q}setZ(J,Q){if(this.normalized)Q=I0(Q,this.array);return this.array[J*this.itemSize+2]=Q,this}getW(J){let Q=this.array[J*this.itemSize+3];if(this.normalized)Q=k9(Q,this.array);return Q}setW(J,Q){if(this.normalized)Q=I0(Q,this.array);return this.array[J*this.itemSize+3]=Q,this}setXY(J,Q,$){if(J*=this.itemSize,this.normalized)Q=I0(Q,this.array),$=I0($,this.array);return this.array[J+0]=Q,this.array[J+1]=$,this}setXYZ(J,Q,$,Z){if(J*=this.itemSize,this.normalized)Q=I0(Q,this.array),$=I0($,this.array),Z=I0(Z,this.array);return this.array[J+0]=Q,this.array[J+1]=$,this.array[J+2]=Z,this}setXYZW(J,Q,$,Z,W){if(J*=this.itemSize,this.normalized)Q=I0(Q,this.array),$=I0($,this.array),Z=I0(Z,this.array),W=I0(W,this.array);return this.array[J+0]=Q,this.array[J+1]=$,this.array[J+2]=Z,this.array[J+3]=W,this}onUpload(J){return this.onUploadCallback=J,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let J={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};if(this.name!=="")J.name=this.name;if(this.usage!==35044)J.usage=this.usage;return J}}class f6 extends aJ{constructor(J,Q,$){super(new Uint16Array(J),Q,$)}}class b6 extends aJ{constructor(J,Q,$){super(new Uint32Array(J),Q,$)}}class d0 extends aJ{constructor(J,Q,$){super(new Float32Array(J),Q,$)}}var oW=0,f0=new W0,L7=new M0,e8=new f,A0=new j8,B9=new j8,q0=new f;class S0 extends F8{constructor(){super();this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:oW++}),this.uuid=v9(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(J){if(Array.isArray(J))this.index=new((DQ(J))?b6:f6)(J,1);else this.index=J;return this}setIndirect(J){return this.indirect=J,this}getIndirect(){return this.indirect}getAttribute(J){return this.attributes[J]}setAttribute(J,Q){return this.attributes[J]=Q,this}deleteAttribute(J){return delete this.attributes[J],this}hasAttribute(J){return this.attributes[J]!==void 0}addGroup(J,Q,$=0){this.groups.push({start:J,count:Q,materialIndex:$})}clearGroups(){this.groups=[]}setDrawRange(J,Q){this.drawRange.start=J,this.drawRange.count=Q}applyMatrix4(J){let Q=this.attributes.position;if(Q!==void 0)Q.applyMatrix4(J),Q.needsUpdate=!0;let $=this.attributes.normal;if($!==void 0){let W=new vJ().getNormalMatrix(J);$.applyNormalMatrix(W),$.needsUpdate=!0}let Z=this.attributes.tangent;if(Z!==void 0)Z.transformDirection(J),Z.needsUpdate=!0;if(this.boundingBox!==null)this.computeBoundingBox();if(this.boundingSphere!==null)this.computeBoundingSphere();return this}applyQuaternion(J){return f0.makeRotationFromQuaternion(J),this.applyMatrix4(f0),this}rotateX(J){return f0.makeRotationX(J),this.applyMatrix4(f0),this}rotateY(J){return f0.makeRotationY(J),this.applyMatrix4(f0),this}rotateZ(J){return f0.makeRotationZ(J),this.applyMatrix4(f0),this}translate(J,Q,$){return f0.makeTranslation(J,Q,$),this.applyMatrix4(f0),this}scale(J,Q,$){return f0.makeScale(J,Q,$),this.applyMatrix4(f0),this}lookAt(J){return L7.lookAt(J),L7.updateMatrix(),this.applyMatrix4(L7.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(e8).negate(),this.translate(e8.x,e8.y,e8.z),this}setFromPoints(J){let Q=this.getAttribute("position");if(Q===void 0){let $=[];for(let Z=0,W=J.length;Z<W;Z++){let K=J[Z];$.push(K.x,K.y,K.z||0)}this.setAttribute("position",new d0($,3))}else{let $=Math.min(J.length,Q.count);for(let Z=0;Z<$;Z++){let W=J[Z];Q.setXYZ(Z,W.x,W.y,W.z||0)}if(J.length>Q.count)console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.");Q.needsUpdate=!0}return this}computeBoundingBox(){if(this.boundingBox===null)this.boundingBox=new j8;let J=this.attributes.position,Q=this.morphAttributes.position;if(J&&J.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new f(-1/0,-1/0,-1/0),new f(1/0,1/0,1/0));return}if(J!==void 0){if(this.boundingBox.setFromBufferAttribute(J),Q)for(let $=0,Z=Q.length;$<Z;$++){let W=Q[$];if(A0.setFromBufferAttribute(W),this.morphTargetsRelative)q0.addVectors(this.boundingBox.min,A0.min),this.boundingBox.expandByPoint(q0),q0.addVectors(this.boundingBox.max,A0.max),this.boundingBox.expandByPoint(q0);else this.boundingBox.expandByPoint(A0.min),this.boundingBox.expandByPoint(A0.max)}}else this.boundingBox.makeEmpty();if(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){if(this.boundingSphere===null)this.boundingSphere=new y8;let J=this.attributes.position,Q=this.morphAttributes.position;if(J&&J.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new f,1/0);return}if(J){let $=this.boundingSphere.center;if(A0.setFromBufferAttribute(J),Q)for(let W=0,K=Q.length;W<K;W++){let H=Q[W];if(B9.setFromBufferAttribute(H),this.morphTargetsRelative)q0.addVectors(A0.min,B9.min),A0.expandByPoint(q0),q0.addVectors(A0.max,B9.max),A0.expandByPoint(q0);else A0.expandByPoint(B9.min),A0.expandByPoint(B9.max)}A0.getCenter($);let Z=0;for(let W=0,K=J.count;W<K;W++)q0.fromBufferAttribute(J,W),Z=Math.max(Z,$.distanceToSquared(q0));if(Q)for(let W=0,K=Q.length;W<K;W++){let H=Q[W],Y=this.morphTargetsRelative;for(let X=0,U=H.count;X<U;X++){if(q0.fromBufferAttribute(H,X),Y)e8.fromBufferAttribute(J,X),q0.add(e8);Z=Math.max(Z,$.distanceToSquared(q0))}}if(this.boundingSphere.radius=Math.sqrt(Z),isNaN(this.boundingSphere.radius))console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let J=this.index,Q=this.attributes;if(J===null||Q.position===void 0||Q.normal===void 0||Q.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let{position:$,normal:Z,uv:W}=Q;if(this.hasAttribute("tangent")===!1)this.setAttribute("tangent",new aJ(new Float32Array(4*$.count),4));let K=this.getAttribute("tangent"),H=[],Y=[];for(let A=0;A<$.count;A++)H[A]=new f,Y[A]=new f;let X=new f,U=new f,E=new f,G=new cJ,N=new cJ,O=new cJ,M=new f,k=new f;function q(A,x,z){X.fromBufferAttribute($,A),U.fromBufferAttribute($,x),E.fromBufferAttribute($,z),G.fromBufferAttribute(W,A),N.fromBufferAttribute(W,x),O.fromBufferAttribute(W,z),U.sub(X),E.sub(X),N.sub(G),O.sub(G);let L=1/(N.x*O.y-O.x*N.y);if(!isFinite(L))return;M.copy(U).multiplyScalar(O.y).addScaledVector(E,-N.y).multiplyScalar(L),k.copy(E).multiplyScalar(N.x).addScaledVector(U,-O.x).multiplyScalar(L),H[A].add(M),H[x].add(M),H[z].add(M),Y[A].add(k),Y[x].add(k),Y[z].add(k)}let D=this.groups;if(D.length===0)D=[{start:0,count:J.count}];for(let A=0,x=D.length;A<x;++A){let z=D[A],L=z.start,T=z.count;for(let d=L,c=L+T;d<c;d+=3)q(J.getX(d+0),J.getX(d+1),J.getX(d+2))}let P=new f,V=new f,I=new f,S=new f;function C(A){I.fromBufferAttribute(Z,A),S.copy(I);let x=H[A];P.copy(x),P.sub(I.multiplyScalar(I.dot(x))).normalize(),V.crossVectors(S,x);let L=V.dot(Y[A])<0?-1:1;K.setXYZW(A,P.x,P.y,P.z,L)}for(let A=0,x=D.length;A<x;++A){let z=D[A],L=z.start,T=z.count;for(let d=L,c=L+T;d<c;d+=3)C(J.getX(d+0)),C(J.getX(d+1)),C(J.getX(d+2))}}computeVertexNormals(){let J=this.index,Q=this.getAttribute("position");if(Q!==void 0){let $=this.getAttribute("normal");if($===void 0)$=new aJ(new Float32Array(Q.count*3),3),this.setAttribute("normal",$);else for(let G=0,N=$.count;G<N;G++)$.setXYZ(G,0,0,0);let Z=new f,W=new f,K=new f,H=new f,Y=new f,X=new f,U=new f,E=new f;if(J)for(let G=0,N=J.count;G<N;G+=3){let O=J.getX(G+0),M=J.getX(G+1),k=J.getX(G+2);Z.fromBufferAttribute(Q,O),W.fromBufferAttribute(Q,M),K.fromBufferAttribute(Q,k),U.subVectors(K,W),E.subVectors(Z,W),U.cross(E),H.fromBufferAttribute($,O),Y.fromBufferAttribute($,M),X.fromBufferAttribute($,k),H.add(U),Y.add(U),X.add(U),$.setXYZ(O,H.x,H.y,H.z),$.setXYZ(M,Y.x,Y.y,Y.z),$.setXYZ(k,X.x,X.y,X.z)}else for(let G=0,N=Q.count;G<N;G+=3)Z.fromBufferAttribute(Q,G+0),W.fromBufferAttribute(Q,G+1),K.fromBufferAttribute(Q,G+2),U.subVectors(K,W),E.subVectors(Z,W),U.cross(E),$.setXYZ(G+0,U.x,U.y,U.z),$.setXYZ(G+1,U.x,U.y,U.z),$.setXYZ(G+2,U.x,U.y,U.z);this.normalizeNormals(),$.needsUpdate=!0}}normalizeNormals(){let J=this.attributes.normal;for(let Q=0,$=J.count;Q<$;Q++)q0.fromBufferAttribute(J,Q),q0.normalize(),J.setXYZ(Q,q0.x,q0.y,q0.z)}toNonIndexed(){function J(H,Y){let{array:X,itemSize:U,normalized:E}=H,G=new X.constructor(Y.length*U),N=0,O=0;for(let M=0,k=Y.length;M<k;M++){if(H.isInterleavedBufferAttribute)N=Y[M]*H.data.stride+H.offset;else N=Y[M]*U;for(let q=0;q<U;q++)G[O++]=X[N++]}return new aJ(G,U,E)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let Q=new S0,$=this.index.array,Z=this.attributes;for(let H in Z){let Y=Z[H],X=J(Y,$);Q.setAttribute(H,X)}let W=this.morphAttributes;for(let H in W){let Y=[],X=W[H];for(let U=0,E=X.length;U<E;U++){let G=X[U],N=J(G,$);Y.push(N)}Q.morphAttributes[H]=Y}Q.morphTargetsRelative=this.morphTargetsRelative;let K=this.groups;for(let H=0,Y=K.length;H<Y;H++){let X=K[H];Q.addGroup(X.start,X.count,X.materialIndex)}return Q}toJSON(){let J={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(J.uuid=this.uuid,J.type=this.type,this.name!=="")J.name=this.name;if(Object.keys(this.userData).length>0)J.userData=this.userData;if(this.parameters!==void 0){let Y=this.parameters;for(let X in Y)if(Y[X]!==void 0)J[X]=Y[X];return J}J.data={attributes:{}};let Q=this.index;if(Q!==null)J.data.index={type:Q.array.constructor.name,array:Array.prototype.slice.call(Q.array)};let $=this.attributes;for(let Y in $){let X=$[Y];J.data.attributes[Y]=X.toJSON(J.data)}let Z={},W=!1;for(let Y in this.morphAttributes){let X=this.morphAttributes[Y],U=[];for(let E=0,G=X.length;E<G;E++){let N=X[E];U.push(N.toJSON(J.data))}if(U.length>0)Z[Y]=U,W=!0}if(W)J.data.morphAttributes=Z,J.data.morphTargetsRelative=this.morphTargetsRelative;let K=this.groups;if(K.length>0)J.data.groups=JSON.parse(JSON.stringify(K));let H=this.boundingSphere;if(H!==null)J.data.boundingSphere=H.toJSON();return J}clone(){return new this.constructor().copy(this)}copy(J){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let Q={};this.name=J.name;let $=J.index;if($!==null)this.setIndex($.clone());let Z=J.attributes;for(let X in Z){let U=Z[X];this.setAttribute(X,U.clone(Q))}let W=J.morphAttributes;for(let X in W){let U=[],E=W[X];for(let G=0,N=E.length;G<N;G++)U.push(E[G].clone(Q));this.morphAttributes[X]=U}this.morphTargetsRelative=J.morphTargetsRelative;let K=J.groups;for(let X=0,U=K.length;X<U;X++){let E=K[X];this.addGroup(E.start,E.count,E.materialIndex)}let H=J.boundingBox;if(H!==null)this.boundingBox=H.clone();let Y=J.boundingSphere;if(Y!==null)this.boundingSphere=Y.clone();return this.drawRange.start=J.drawRange.start,this.drawRange.count=J.drawRange.count,this.userData=J.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}var L$=new W0,C8=new b9,Q6=new y8,z$=new f,$6=new f,Z6=new f,W6=new f,z7=new f,K6=new f,B$=new f,Y6=new f;class l0 extends M0{constructor(J=new S0,Q=new v6){super();this.isMesh=!0,this.type="Mesh",this.geometry=J,this.material=Q,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(J,Q){if(super.copy(J,Q),J.morphTargetInfluences!==void 0)this.morphTargetInfluences=J.morphTargetInfluences.slice();if(J.morphTargetDictionary!==void 0)this.morphTargetDictionary=Object.assign({},J.morphTargetDictionary);return this.material=Array.isArray(J.material)?J.material.slice():J.material,this.geometry=J.geometry,this}updateMorphTargets(){let Q=this.geometry.morphAttributes,$=Object.keys(Q);if($.length>0){let Z=Q[$[0]];if(Z!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let W=0,K=Z.length;W<K;W++){let H=Z[W].name||String(W);this.morphTargetInfluences.push(0),this.morphTargetDictionary[H]=W}}}}getVertexPosition(J,Q){let $=this.geometry,Z=$.attributes.position,W=$.morphAttributes.position,K=$.morphTargetsRelative;Q.fromBufferAttribute(Z,J);let H=this.morphTargetInfluences;if(W&&H){K6.set(0,0,0);for(let Y=0,X=W.length;Y<X;Y++){let U=H[Y],E=W[Y];if(U===0)continue;if(z7.fromBufferAttribute(E,J),K)K6.addScaledVector(z7,U);else K6.addScaledVector(z7.sub(Q),U)}Q.add(K6)}return Q}raycast(J,Q){let $=this.geometry,Z=this.material,W=this.matrixWorld;if(Z===void 0)return;if($.boundingSphere===null)$.computeBoundingSphere();if(Q6.copy($.boundingSphere),Q6.applyMatrix4(W),C8.copy(J.ray).recast(J.near),Q6.containsPoint(C8.origin)===!1){if(C8.intersectSphere(Q6,z$)===null)return;if(C8.origin.distanceToSquared(z$)>(J.far-J.near)**2)return}if(L$.copy(W).invert(),C8.copy(J.ray).applyMatrix4(L$),$.boundingBox!==null){if(C8.intersectsBox($.boundingBox)===!1)return}this._computeIntersections(J,Q,C8)}_computeIntersections(J,Q,$){let Z,W=this.geometry,K=this.material,H=W.index,Y=W.attributes.position,X=W.attributes.uv,U=W.attributes.uv1,E=W.attributes.normal,G=W.groups,N=W.drawRange;if(H!==null)if(Array.isArray(K))for(let O=0,M=G.length;O<M;O++){let k=G[O],q=K[k.materialIndex],D=Math.max(k.start,N.start),P=Math.min(H.count,Math.min(k.start+k.count,N.start+N.count));for(let V=D,I=P;V<I;V+=3){let S=H.getX(V),C=H.getX(V+1),A=H.getX(V+2);if(Z=H6(this,q,J,$,X,U,E,S,C,A),Z)Z.faceIndex=Math.floor(V/3),Z.face.materialIndex=k.materialIndex,Q.push(Z)}}else{let O=Math.max(0,N.start),M=Math.min(H.count,N.start+N.count);for(let k=O,q=M;k<q;k+=3){let D=H.getX(k),P=H.getX(k+1),V=H.getX(k+2);if(Z=H6(this,K,J,$,X,U,E,D,P,V),Z)Z.faceIndex=Math.floor(k/3),Q.push(Z)}}else if(Y!==void 0)if(Array.isArray(K))for(let O=0,M=G.length;O<M;O++){let k=G[O],q=K[k.materialIndex],D=Math.max(k.start,N.start),P=Math.min(Y.count,Math.min(k.start+k.count,N.start+N.count));for(let V=D,I=P;V<I;V+=3){let S=V,C=V+1,A=V+2;if(Z=H6(this,q,J,$,X,U,E,S,C,A),Z)Z.faceIndex=Math.floor(V/3),Z.face.materialIndex=k.materialIndex,Q.push(Z)}}else{let O=Math.max(0,N.start),M=Math.min(Y.count,N.start+N.count);for(let k=O,q=M;k<q;k+=3){let D=k,P=k+1,V=k+2;if(Z=H6(this,K,J,$,X,U,E,D,P,V),Z)Z.faceIndex=Math.floor(k/3),Q.push(Z)}}}}function aW(J,Q,$,Z,W,K,H,Y){let X;if(Q.side===1)X=Z.intersectTriangle(H,K,W,!0,Y);else X=Z.intersectTriangle(W,K,H,Q.side===0,Y);if(X===null)return null;Y6.copy(Y),Y6.applyMatrix4(J.matrixWorld);let U=$.ray.origin.distanceTo(Y6);if(U<$.near||U>$.far)return null;return{distance:U,point:Y6.clone(),object:J}}function H6(J,Q,$,Z,W,K,H,Y,X,U){J.getVertexPosition(Y,$6),J.getVertexPosition(X,Z6),J.getVertexPosition(U,W6);let E=aW(J,Q,$,Z,$6,Z6,W6,B$);if(E){let G=new f;if(b0.getBarycoord(B$,$6,Z6,W6,G),W)E.uv=b0.getInterpolatedAttribute(W,Y,X,U,G,new cJ);if(K)E.uv1=b0.getInterpolatedAttribute(K,Y,X,U,G,new cJ);if(H){if(E.normal=b0.getInterpolatedAttribute(H,Y,X,U,G,new f),E.normal.dot(Z.direction)>0)E.normal.multiplyScalar(-1)}let N={a:Y,b:X,c:U,normal:new f,materialIndex:0};b0.getNormal($6,Z6,W6,N.normal),E.face=N,E.barycoord=G}return E}class N9 extends S0{constructor(J=1,Q=1,$=1,Z=1,W=1,K=1){super();this.type="BoxGeometry",this.parameters={width:J,height:Q,depth:$,widthSegments:Z,heightSegments:W,depthSegments:K};let H=this;Z=Math.floor(Z),W=Math.floor(W),K=Math.floor(K);let Y=[],X=[],U=[],E=[],G=0,N=0;O("z","y","x",-1,-1,$,Q,J,K,W,0),O("z","y","x",1,-1,$,Q,-J,K,W,1),O("x","z","y",1,1,J,$,Q,Z,K,2),O("x","z","y",1,-1,J,$,-Q,Z,K,3),O("x","y","z",1,-1,J,Q,$,Z,W,4),O("x","y","z",-1,-1,J,Q,-$,Z,W,5),this.setIndex(Y),this.setAttribute("position",new d0(X,3)),this.setAttribute("normal",new d0(U,3)),this.setAttribute("uv",new d0(E,2));function O(M,k,q,D,P,V,I,S,C,A,x){let z=V/C,L=I/A,T=V/2,d=I/2,c=S/2,m=C+1,o=A+1,l=0,r=0,g=new f;for(let KJ=0;KJ<o;KJ++){let GJ=KJ*L-d;for(let PJ=0;PJ<m;PJ++){let xJ=PJ*z-T;g[M]=xJ*D,g[k]=GJ*P,g[q]=c,X.push(g.x,g.y,g.z),g[M]=0,g[k]=0,g[q]=S>0?1:-1,U.push(g.x,g.y,g.z),E.push(PJ/C),E.push(1-KJ/A),l+=1}}for(let KJ=0;KJ<A;KJ++)for(let GJ=0;GJ<C;GJ++){let PJ=G+GJ+m*KJ,xJ=G+GJ+m*(KJ+1),Y0=G+(GJ+1)+m*(KJ+1),mJ=G+(GJ+1)+m*KJ;Y.push(PJ,xJ,mJ),Y.push(xJ,Y0,mJ),r+=6}H.addGroup(N,r,x),N+=r,G+=l}}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new N9(J.width,J.height,J.depth,J.widthSegments,J.heightSegments,J.depthSegments)}}function v8(J){let Q={};for(let $ in J){Q[$]={};for(let Z in J[$]){let W=J[$][Z];if(W&&(W.isColor||W.isMatrix3||W.isMatrix4||W.isVector2||W.isVector3||W.isVector4||W.isTexture||W.isQuaternion))if(W.isRenderTargetTexture)console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),Q[$][Z]=null;else Q[$][Z]=W.clone();else if(Array.isArray(W))Q[$][Z]=W.slice();else Q[$][Z]=W}}return Q}function k0(J){let Q={};for(let $=0;$<J.length;$++){let Z=v8(J[$]);for(let W in Z)Q[W]=Z[W]}return Q}function rW(J){let Q=[];for(let $=0;$<J.length;$++)Q.push(J[$].clone());return Q}function MQ(J){let Q=J.getRenderTarget();if(Q===null)return J.outputColorSpace;if(Q.isXRRenderTarget===!0)return Q.texture.colorSpace;return pJ.workingColorSpace}var xZ={clone:v8,merge:k0},tW=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,eW=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class j0 extends k8{constructor(J){super();if(this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=tW,this.fragmentShader=eW,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,J!==void 0)this.setValues(J)}copy(J){return super.copy(J),this.fragmentShader=J.fragmentShader,this.vertexShader=J.vertexShader,this.uniforms=v8(J.uniforms),this.uniformsGroups=rW(J.uniformsGroups),this.defines=Object.assign({},J.defines),this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.fog=J.fog,this.lights=J.lights,this.clipping=J.clipping,this.extensions=Object.assign({},J.extensions),this.glslVersion=J.glslVersion,this}toJSON(J){let Q=super.toJSON(J);Q.glslVersion=this.glslVersion,Q.uniforms={};for(let Z in this.uniforms){let K=this.uniforms[Z].value;if(K&&K.isTexture)Q.uniforms[Z]={type:"t",value:K.toJSON(J).uuid};else if(K&&K.isColor)Q.uniforms[Z]={type:"c",value:K.getHex()};else if(K&&K.isVector2)Q.uniforms[Z]={type:"v2",value:K.toArray()};else if(K&&K.isVector3)Q.uniforms[Z]={type:"v3",value:K.toArray()};else if(K&&K.isVector4)Q.uniforms[Z]={type:"v4",value:K.toArray()};else if(K&&K.isMatrix3)Q.uniforms[Z]={type:"m3",value:K.toArray()};else if(K&&K.isMatrix4)Q.uniforms[Z]={type:"m4",value:K.toArray()};else Q.uniforms[Z]={value:K}}if(Object.keys(this.defines).length>0)Q.defines=this.defines;Q.vertexShader=this.vertexShader,Q.fragmentShader=this.fragmentShader,Q.lights=this.lights,Q.clipping=this.clipping;let $={};for(let Z in this.extensions)if(this.extensions[Z]===!0)$[Z]=!0;if(Object.keys($).length>0)Q.extensions=$;return Q}}class h6 extends M0{constructor(){super();this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new W0,this.projectionMatrix=new W0,this.projectionMatrixInverse=new W0,this.coordinateSystem=2000,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(J,Q){return super.copy(J,Q),this.matrixWorldInverse.copy(J.matrixWorldInverse),this.projectionMatrix.copy(J.projectionMatrix),this.projectionMatrixInverse.copy(J.projectionMatrixInverse),this.coordinateSystem=J.coordinateSystem,this}getWorldDirection(J){return super.getWorldDirection(J).negate()}updateMatrixWorld(J){super.updateMatrixWorld(J),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(J,Q){super.updateWorldMatrix(J,Q),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}var N8=new f,I$=new cJ,_$=new cJ;class L0 extends h6{constructor(J=50,Q=1,$=0.1,Z=2000){super();this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=J,this.zoom=1,this.near=$,this.far=Z,this.focus=10,this.aspect=Q,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(J,Q){return super.copy(J,Q),this.fov=J.fov,this.zoom=J.zoom,this.near=J.near,this.far=J.far,this.focus=J.focus,this.aspect=J.aspect,this.view=J.view===null?null:Object.assign({},J.view),this.filmGauge=J.filmGauge,this.filmOffset=J.filmOffset,this}setFocalLength(J){let Q=0.5*this.getFilmHeight()/J;this.fov=D6*2*Math.atan(Q),this.updateProjectionMatrix()}getFocalLength(){let J=Math.tan(Q7*0.5*this.fov);return 0.5*this.getFilmHeight()/J}getEffectiveFOV(){return D6*2*Math.atan(Math.tan(Q7*0.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(J,Q,$){N8.set(-1,-1,0.5).applyMatrix4(this.projectionMatrixInverse),Q.set(N8.x,N8.y).multiplyScalar(-J/N8.z),N8.set(1,1,0.5).applyMatrix4(this.projectionMatrixInverse),$.set(N8.x,N8.y).multiplyScalar(-J/N8.z)}getViewSize(J,Q){return this.getViewBounds(J,I$,_$),Q.subVectors(_$,I$)}setViewOffset(J,Q,$,Z,W,K){if(this.aspect=J/Q,this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=J,this.view.fullHeight=Q,this.view.offsetX=$,this.view.offsetY=Z,this.view.width=W,this.view.height=K,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let J=this.near,Q=J*Math.tan(Q7*0.5*this.fov)/this.zoom,$=2*Q,Z=this.aspect*$,W=-0.5*Z,K=this.view;if(this.view!==null&&this.view.enabled){let{fullWidth:Y,fullHeight:X}=K;W+=K.offsetX*Z/Y,Q-=K.offsetY*$/X,Z*=K.width/Y,$*=K.height/X}let H=this.filmOffset;if(H!==0)W+=J*H/this.getFilmWidth();this.projectionMatrix.makePerspective(W,W+Z,Q,Q-$,J,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(J){let Q=super.toJSON(J);if(Q.object.fov=this.fov,Q.object.zoom=this.zoom,Q.object.near=this.near,Q.object.far=this.far,Q.object.focus=this.focus,Q.object.aspect=this.aspect,this.view!==null)Q.object.view=Object.assign({},this.view);return Q.object.filmGauge=this.filmGauge,Q.object.filmOffset=this.filmOffset,Q}}var J9=-90,Q9=1;class kQ extends M0{constructor(J,Q,$){super();this.type="CubeCamera",this.renderTarget=$,this.coordinateSystem=null,this.activeMipmapLevel=0;let Z=new L0(J9,Q9,J,Q);Z.layers=this.layers,this.add(Z);let W=new L0(J9,Q9,J,Q);W.layers=this.layers,this.add(W);let K=new L0(J9,Q9,J,Q);K.layers=this.layers,this.add(K);let H=new L0(J9,Q9,J,Q);H.layers=this.layers,this.add(H);let Y=new L0(J9,Q9,J,Q);Y.layers=this.layers,this.add(Y);let X=new L0(J9,Q9,J,Q);X.layers=this.layers,this.add(X)}updateCoordinateSystem(){let J=this.coordinateSystem,Q=this.children.concat(),[$,Z,W,K,H,Y]=Q;for(let X of Q)this.remove(X);if(J===2000)$.up.set(0,1,0),$.lookAt(1,0,0),Z.up.set(0,1,0),Z.lookAt(-1,0,0),W.up.set(0,0,-1),W.lookAt(0,1,0),K.up.set(0,0,1),K.lookAt(0,-1,0),H.up.set(0,1,0),H.lookAt(0,0,1),Y.up.set(0,1,0),Y.lookAt(0,0,-1);else if(J===2001)$.up.set(0,-1,0),$.lookAt(-1,0,0),Z.up.set(0,-1,0),Z.lookAt(1,0,0),W.up.set(0,0,1),W.lookAt(0,1,0),K.up.set(0,0,-1),K.lookAt(0,-1,0),H.up.set(0,-1,0),H.lookAt(0,0,1),Y.up.set(0,-1,0),Y.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+J);for(let X of Q)this.add(X),X.updateMatrixWorld()}update(J,Q){if(this.parent===null)this.updateMatrixWorld();let{renderTarget:$,activeMipmapLevel:Z}=this;if(this.coordinateSystem!==J.coordinateSystem)this.coordinateSystem=J.coordinateSystem,this.updateCoordinateSystem();let[W,K,H,Y,X,U]=this.children,E=J.getRenderTarget(),G=J.getActiveCubeFace(),N=J.getActiveMipmapLevel(),O=J.xr.enabled;J.xr.enabled=!1;let M=$.texture.generateMipmaps;$.texture.generateMipmaps=!1,J.setRenderTarget($,0,Z),J.render(Q,W),J.setRenderTarget($,1,Z),J.render(Q,K),J.setRenderTarget($,2,Z),J.render(Q,H),J.setRenderTarget($,3,Z),J.render(Q,Y),J.setRenderTarget($,4,Z),J.render(Q,X),$.texture.generateMipmaps=M,J.setRenderTarget($,5,Z),J.render(Q,U),J.setRenderTarget(E,G,N),J.xr.enabled=O,$.texture.needsPMREMUpdate=!0}}class x6 extends z0{constructor(J=[],Q=301,$,Z,W,K,H,Y,X,U){super(J,Q,$,Z,W,K,H,Y,X,U);this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(J){this.image=J}}class VQ extends Y8{constructor(J=1,Q={}){super(J,J,Q);this.isWebGLCubeRenderTarget=!0;let $={width:J,height:J,depth:1},Z=[$,$,$,$,$,$];this.texture=new x6(Z),this._setTextureOptions(Q),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(J,Q){this.texture.type=Q.type,this.texture.colorSpace=Q.colorSpace,this.texture.generateMipmaps=Q.generateMipmaps,this.texture.minFilter=Q.minFilter,this.texture.magFilter=Q.magFilter;let $={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},Z=new N9(5,5,5),W=new j0({name:"CubemapFromEquirect",uniforms:v8($.uniforms),vertexShader:$.vertexShader,fragmentShader:$.fragmentShader,side:1,blending:0});W.uniforms.tEquirect.value=Q;let K=new l0(Z,W),H=Q.minFilter;if(Q.minFilter===1008)Q.minFilter=1006;return new kQ(1,10,this).update(J,K),Q.minFilter=H,K.geometry.dispose(),K.material.dispose(),this}clear(J,Q=!0,$=!0,Z=!0){let W=J.getRenderTarget();for(let K=0;K<6;K++)J.setRenderTarget(this,K),J.clear(Q,$,Z);J.setRenderTarget(W)}}class q8 extends M0{constructor(){super();this.isGroup=!0,this.type="Group"}}var JK={type:"move"};class h9{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){if(this._hand===null)this._hand=new q8,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1};return this._hand}getTargetRaySpace(){if(this._targetRay===null)this._targetRay=new q8,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new f,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new f;return this._targetRay}getGripSpace(){if(this._grip===null)this._grip=new q8,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new f,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new f;return this._grip}dispatchEvent(J){if(this._targetRay!==null)this._targetRay.dispatchEvent(J);if(this._grip!==null)this._grip.dispatchEvent(J);if(this._hand!==null)this._hand.dispatchEvent(J);return this}connect(J){if(J&&J.hand){let Q=this._hand;if(Q)for(let $ of J.hand.values())this._getHandJoint(Q,$)}return this.dispatchEvent({type:"connected",data:J}),this}disconnect(J){if(this.dispatchEvent({type:"disconnected",data:J}),this._targetRay!==null)this._targetRay.visible=!1;if(this._grip!==null)this._grip.visible=!1;if(this._hand!==null)this._hand.visible=!1;return this}update(J,Q,$){let Z=null,W=null,K=null,H=this._targetRay,Y=this._grip,X=this._hand;if(J&&Q.session.visibilityState!=="visible-blurred"){if(X&&J.hand){K=!0;for(let M of J.hand.values()){let k=Q.getJointPose(M,$),q=this._getHandJoint(X,M);if(k!==null)q.matrix.fromArray(k.transform.matrix),q.matrix.decompose(q.position,q.rotation,q.scale),q.matrixWorldNeedsUpdate=!0,q.jointRadius=k.radius;q.visible=k!==null}let U=X.joints["index-finger-tip"],E=X.joints["thumb-tip"],G=U.position.distanceTo(E.position),N=0.02,O=0.005;if(X.inputState.pinching&&G>N+O)X.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:J.handedness,target:this});else if(!X.inputState.pinching&&G<=N-O)X.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:J.handedness,target:this})}else if(Y!==null&&J.gripSpace){if(W=Q.getPose(J.gripSpace,$),W!==null){if(Y.matrix.fromArray(W.transform.matrix),Y.matrix.decompose(Y.position,Y.rotation,Y.scale),Y.matrixWorldNeedsUpdate=!0,W.linearVelocity)Y.hasLinearVelocity=!0,Y.linearVelocity.copy(W.linearVelocity);else Y.hasLinearVelocity=!1;if(W.angularVelocity)Y.hasAngularVelocity=!0,Y.angularVelocity.copy(W.angularVelocity);else Y.hasAngularVelocity=!1}}if(H!==null){if(Z=Q.getPose(J.targetRaySpace,$),Z===null&&W!==null)Z=W;if(Z!==null){if(H.matrix.fromArray(Z.transform.matrix),H.matrix.decompose(H.position,H.rotation,H.scale),H.matrixWorldNeedsUpdate=!0,Z.linearVelocity)H.hasLinearVelocity=!0,H.linearVelocity.copy(Z.linearVelocity);else H.hasLinearVelocity=!1;if(Z.angularVelocity)H.hasAngularVelocity=!0,H.angularVelocity.copy(Z.angularVelocity);else H.hasAngularVelocity=!1;this.dispatchEvent(JK)}}}if(H!==null)H.visible=Z!==null;if(Y!==null)Y.visible=W!==null;if(X!==null)X.visible=K!==null;return this}_getHandJoint(J,Q){if(J.joints[Q.jointName]===void 0){let $=new q8;$.matrixAutoUpdate=!1,$.visible=!1,J.joints[Q.jointName]=$,J.add($)}return J.joints[Q.jointName]}}class g6 extends M0{constructor(){super();if(this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new s0,this.environmentIntensity=1,this.environmentRotation=new s0,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!=="undefined")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(J,Q){if(super.copy(J,Q),J.background!==null)this.background=J.background.clone();if(J.environment!==null)this.environment=J.environment.clone();if(J.fog!==null)this.fog=J.fog.clone();if(this.backgroundBlurriness=J.backgroundBlurriness,this.backgroundIntensity=J.backgroundIntensity,this.backgroundRotation.copy(J.backgroundRotation),this.environmentIntensity=J.environmentIntensity,this.environmentRotation.copy(J.environmentRotation),J.overrideMaterial!==null)this.overrideMaterial=J.overrideMaterial.clone();return this.matrixAutoUpdate=J.matrixAutoUpdate,this}toJSON(J){let Q=super.toJSON(J);if(this.fog!==null)Q.object.fog=this.fog.toJSON();if(this.backgroundBlurriness>0)Q.object.backgroundBlurriness=this.backgroundBlurriness;if(this.backgroundIntensity!==1)Q.object.backgroundIntensity=this.backgroundIntensity;if(Q.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1)Q.object.environmentIntensity=this.environmentIntensity;return Q.object.environmentRotation=this.environmentRotation.toArray(),Q}}var B7=new f,QK=new f,$K=new vJ;class Z8{constructor(J=new f(1,0,0),Q=0){this.isPlane=!0,this.normal=J,this.constant=Q}set(J,Q){return this.normal.copy(J),this.constant=Q,this}setComponents(J,Q,$,Z){return this.normal.set(J,Q,$),this.constant=Z,this}setFromNormalAndCoplanarPoint(J,Q){return this.normal.copy(J),this.constant=-Q.dot(this.normal),this}setFromCoplanarPoints(J,Q,$){let Z=B7.subVectors($,Q).cross(QK.subVectors(J,Q)).normalize();return this.setFromNormalAndCoplanarPoint(Z,J),this}copy(J){return this.normal.copy(J.normal),this.constant=J.constant,this}normalize(){let J=1/this.normal.length();return this.normal.multiplyScalar(J),this.constant*=J,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(J){return this.normal.dot(J)+this.constant}distanceToSphere(J){return this.distanceToPoint(J.center)-J.radius}projectPoint(J,Q){return Q.copy(J).addScaledVector(this.normal,-this.distanceToPoint(J))}intersectLine(J,Q){let $=J.delta(B7),Z=this.normal.dot($);if(Z===0){if(this.distanceToPoint(J.start)===0)return Q.copy(J.start);return null}let W=-(J.start.dot(this.normal)+this.constant)/Z;if(W<0||W>1)return null;return Q.copy(J.start).addScaledVector($,W)}intersectsLine(J){let Q=this.distanceToPoint(J.start),$=this.distanceToPoint(J.end);return Q<0&&$>0||$<0&&Q>0}intersectsBox(J){return J.intersectsPlane(this)}intersectsSphere(J){return J.intersectsPlane(this)}coplanarPoint(J){return J.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(J,Q){let $=Q||$K.getNormalMatrix(J),Z=this.coplanarPoint(B7).applyMatrix4(J),W=this.normal.applyMatrix3($).normalize();return this.constant=-Z.dot(W),this}translate(J){return this.constant-=J.dot(this.normal),this}equals(J){return J.normal.equals(this.normal)&&J.constant===this.constant}clone(){return new this.constructor().copy(this)}}var w8=new y8,ZK=new cJ(0.5,0.5),X6=new f;class p6{constructor(J=new Z8,Q=new Z8,$=new Z8,Z=new Z8,W=new Z8,K=new Z8){this.planes=[J,Q,$,Z,W,K]}set(J,Q,$,Z,W,K){let H=this.planes;return H[0].copy(J),H[1].copy(Q),H[2].copy($),H[3].copy(Z),H[4].copy(W),H[5].copy(K),this}copy(J){let Q=this.planes;for(let $=0;$<6;$++)Q[$].copy(J.planes[$]);return this}setFromProjectionMatrix(J,Q=2000,$=!1){let Z=this.planes,W=J.elements,K=W[0],H=W[1],Y=W[2],X=W[3],U=W[4],E=W[5],G=W[6],N=W[7],O=W[8],M=W[9],k=W[10],q=W[11],D=W[12],P=W[13],V=W[14],I=W[15];if(Z[0].setComponents(X-K,N-U,q-O,I-D).normalize(),Z[1].setComponents(X+K,N+U,q+O,I+D).normalize(),Z[2].setComponents(X+H,N+E,q+M,I+P).normalize(),Z[3].setComponents(X-H,N-E,q-M,I-P).normalize(),$)Z[4].setComponents(Y,G,k,V).normalize(),Z[5].setComponents(X-Y,N-G,q-k,I-V).normalize();else if(Z[4].setComponents(X-Y,N-G,q-k,I-V).normalize(),Q===2000)Z[5].setComponents(X+Y,N+G,q+k,I+V).normalize();else if(Q===2001)Z[5].setComponents(Y,G,k,V).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+Q);return this}intersectsObject(J){if(J.boundingSphere!==void 0){if(J.boundingSphere===null)J.computeBoundingSphere();w8.copy(J.boundingSphere).applyMatrix4(J.matrixWorld)}else{let Q=J.geometry;if(Q.boundingSphere===null)Q.computeBoundingSphere();w8.copy(Q.boundingSphere).applyMatrix4(J.matrixWorld)}return this.intersectsSphere(w8)}intersectsSprite(J){w8.center.set(0,0,0);let Q=ZK.distanceTo(J.center);return w8.radius=0.7071067811865476+Q,w8.applyMatrix4(J.matrixWorld),this.intersectsSphere(w8)}intersectsSphere(J){let Q=this.planes,$=J.center,Z=-J.radius;for(let W=0;W<6;W++)if(Q[W].distanceToPoint($)<Z)return!1;return!0}intersectsBox(J){let Q=this.planes;for(let $=0;$<6;$++){let Z=Q[$];if(X6.x=Z.normal.x>0?J.max.x:J.min.x,X6.y=Z.normal.y>0?J.max.y:J.min.y,X6.z=Z.normal.z>0?J.max.z:J.min.z,Z.distanceToPoint(X6)<0)return!1}return!0}containsPoint(J){let Q=this.planes;for(let $=0;$<6;$++)if(Q[$].distanceToPoint(J)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class LQ extends k8{constructor(J){super();this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new lJ(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.linewidth=J.linewidth,this.linecap=J.linecap,this.linejoin=J.linejoin,this.fog=J.fog,this}}var O6=new f,R6=new f,C$=new W0,I9=new b9,U6=new y8,I7=new f,w$=new f;class zQ extends M0{constructor(J=new S0,Q=new LQ){super();this.isLine=!0,this.type="Line",this.geometry=J,this.material=Q,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(J,Q){return super.copy(J,Q),this.material=Array.isArray(J.material)?J.material.slice():J.material,this.geometry=J.geometry,this}computeLineDistances(){let J=this.geometry;if(J.index===null){let Q=J.attributes.position,$=[0];for(let Z=1,W=Q.count;Z<W;Z++)O6.fromBufferAttribute(Q,Z-1),R6.fromBufferAttribute(Q,Z),$[Z]=$[Z-1],$[Z]+=O6.distanceTo(R6);J.setAttribute("lineDistance",new d0($,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(J,Q){let $=this.geometry,Z=this.matrixWorld,W=J.params.Line.threshold,K=$.drawRange;if($.boundingSphere===null)$.computeBoundingSphere();if(U6.copy($.boundingSphere),U6.applyMatrix4(Z),U6.radius+=W,J.ray.intersectsSphere(U6)===!1)return;C$.copy(Z).invert(),I9.copy(J.ray).applyMatrix4(C$);let H=W/((this.scale.x+this.scale.y+this.scale.z)/3),Y=H*H,X=this.isLineSegments?2:1,U=$.index,G=$.attributes.position;if(U!==null){let N=Math.max(0,K.start),O=Math.min(U.count,K.start+K.count);for(let M=N,k=O-1;M<k;M+=X){let q=U.getX(M),D=U.getX(M+1),P=G6(this,J,I9,Y,q,D,M);if(P)Q.push(P)}if(this.isLineLoop){let M=U.getX(O-1),k=U.getX(N),q=G6(this,J,I9,Y,M,k,O-1);if(q)Q.push(q)}}else{let N=Math.max(0,K.start),O=Math.min(G.count,K.start+K.count);for(let M=N,k=O-1;M<k;M+=X){let q=G6(this,J,I9,Y,M,M+1,M);if(q)Q.push(q)}if(this.isLineLoop){let M=G6(this,J,I9,Y,O-1,N,O-1);if(M)Q.push(M)}}}updateMorphTargets(){let Q=this.geometry.morphAttributes,$=Object.keys(Q);if($.length>0){let Z=Q[$[0]];if(Z!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let W=0,K=Z.length;W<K;W++){let H=Z[W].name||String(W);this.morphTargetInfluences.push(0),this.morphTargetDictionary[H]=W}}}}}function G6(J,Q,$,Z,W,K,H){let Y=J.geometry.attributes.position;if(O6.fromBufferAttribute(Y,W),R6.fromBufferAttribute(Y,K),$.distanceSqToSegment(O6,R6,I7,w$)>Z)return;I7.applyMatrix4(J.matrixWorld);let U=Q.ray.origin.distanceTo(I7);if(U<Q.near||U>Q.far)return;return{distance:U,point:w$.clone().applyMatrix4(J.matrixWorld),index:H,face:null,faceIndex:null,barycoord:null,object:J}}var P$=new f,A$=new f;class m6 extends zQ{constructor(J,Q){super(J,Q);this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let J=this.geometry;if(J.index===null){let Q=J.attributes.position,$=[];for(let Z=0,W=Q.count;Z<W;Z+=2)P$.fromBufferAttribute(Q,Z),A$.fromBufferAttribute(Q,Z+1),$[Z]=Z===0?0:$[Z-1],$[Z+1]=$[Z]+P$.distanceTo(A$);J.setAttribute("lineDistance",new d0($,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class BQ extends k8{constructor(J){super();this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new lJ(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.alphaMap=J.alphaMap,this.size=J.size,this.sizeAttenuation=J.sizeAttenuation,this.fog=J.fog,this}}var T$=new W0,_7=new b9,E6=new y8,N6=new f;class d6 extends M0{constructor(J=new S0,Q=new BQ){super();this.isPoints=!0,this.type="Points",this.geometry=J,this.material=Q,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(J,Q){return super.copy(J,Q),this.material=Array.isArray(J.material)?J.material.slice():J.material,this.geometry=J.geometry,this}raycast(J,Q){let $=this.geometry,Z=this.matrixWorld,W=J.params.Points.threshold,K=$.drawRange;if($.boundingSphere===null)$.computeBoundingSphere();if(E6.copy($.boundingSphere),E6.applyMatrix4(Z),E6.radius+=W,J.ray.intersectsSphere(E6)===!1)return;T$.copy(Z).invert(),_7.copy(J.ray).applyMatrix4(T$);let H=W/((this.scale.x+this.scale.y+this.scale.z)/3),Y=H*H,X=$.index,E=$.attributes.position;if(X!==null){let G=Math.max(0,K.start),N=Math.min(X.count,K.start+K.count);for(let O=G,M=N;O<M;O++){let k=X.getX(O);N6.fromBufferAttribute(E,k),S$(N6,k,Y,Z,J,Q,this)}}else{let G=Math.max(0,K.start),N=Math.min(E.count,K.start+K.count);for(let O=G,M=N;O<M;O++)N6.fromBufferAttribute(E,O),S$(N6,O,Y,Z,J,Q,this)}}updateMorphTargets(){let Q=this.geometry.morphAttributes,$=Object.keys(Q);if($.length>0){let Z=Q[$[0]];if(Z!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let W=0,K=Z.length;W<K;W++){let H=Z[W].name||String(W);this.morphTargetInfluences.push(0),this.morphTargetDictionary[H]=W}}}}}function S$(J,Q,$,Z,W,K,H){let Y=_7.distanceSqToPoint(J);if(Y<$){let X=new f;_7.closestPointToPoint(J,X),X.applyMatrix4(Z);let U=W.ray.origin.distanceTo(X);if(U<W.near||U>W.far)return;K.push({distance:U,distanceToRay:Math.sqrt(Y),point:X,index:Q,face:null,faceIndex:null,barycoord:null,object:H})}}class l6 extends z0{constructor(J,Q,$=1014,Z,W,K,H=1003,Y=1003,X,U=1026,E=1){if(U!==1026&&U!==1027)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let G={width:J,height:Q,depth:E};super(G,Z,W,K,H,Y,U,$,X);this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(J){return super.copy(J),this.source=new f9(Object.assign({},J.image)),this.compareFunction=J.compareFunction,this}toJSON(J){let Q=super.toJSON(J);if(this.compareFunction!==null)Q.compareFunction=this.compareFunction;return Q}}class u6 extends z0{constructor(J=null){super();this.sourceTexture=J,this.isExternalTexture=!0}copy(J){return super.copy(J),this.sourceTexture=J.sourceTexture,this}}class x9 extends S0{constructor(J=1,Q=1,$=1,Z=1){super();this.type="PlaneGeometry",this.parameters={width:J,height:Q,widthSegments:$,heightSegments:Z};let W=J/2,K=Q/2,H=Math.floor($),Y=Math.floor(Z),X=H+1,U=Y+1,E=J/H,G=Q/Y,N=[],O=[],M=[],k=[];for(let q=0;q<U;q++){let D=q*G-K;for(let P=0;P<X;P++){let V=P*E-W;O.push(V,-D,0),M.push(0,0,1),k.push(P/H),k.push(1-q/Y)}}for(let q=0;q<Y;q++)for(let D=0;D<H;D++){let P=D+X*q,V=D+X*(q+1),I=D+1+X*(q+1),S=D+1+X*q;N.push(P,V,S),N.push(V,I,S)}this.setIndex(N),this.setAttribute("position",new d0(O,3)),this.setAttribute("normal",new d0(M,3)),this.setAttribute("uv",new d0(k,2))}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new x9(J.width,J.height,J.widthSegments,J.heightSegments)}}class IQ extends k8{constructor(J){super();this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(J)}copy(J){return super.copy(J),this.depthPacking=J.depthPacking,this.map=J.map,this.alphaMap=J.alphaMap,this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this}}class _Q extends k8{constructor(J){super();this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(J)}copy(J){return super.copy(J),this.map=J.map,this.alphaMap=J.alphaMap,this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this}}function q6(J,Q){if(!J||J.constructor===Q)return J;if(typeof Q.BYTES_PER_ELEMENT==="number")return new Q(J);return Array.prototype.slice.call(J)}function WK(J){return ArrayBuffer.isView(J)&&!(J instanceof DataView)}class q9{constructor(J,Q,$,Z){this.parameterPositions=J,this._cachedIndex=0,this.resultBuffer=Z!==void 0?Z:new Q.constructor($),this.sampleValues=Q,this.valueSize=$,this.settings=null,this.DefaultSettings_={}}evaluate(J){let Q=this.parameterPositions,$=this._cachedIndex,Z=Q[$],W=Q[$-1];$:{J:{let K;Q:{Z:if(!(J<Z)){for(let H=$+2;;){if(Z===void 0){if(J<W)break Z;return $=Q.length,this._cachedIndex=$,this.copySampleValue_($-1)}if($===H)break;if(W=Z,Z=Q[++$],J<Z)break J}K=Q.length;break Q}if(!(J>=W)){let H=Q[1];if(J<H)$=2,W=H;for(let Y=$-2;;){if(W===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if($===Y)break;if(Z=W,W=Q[--$-1],J>=W)break J}K=$,$=0;break Q}break $}while($<K){let H=$+K>>>1;if(J<Q[H])K=H;else $=H+1}if(Z=Q[$],W=Q[$-1],W===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(Z===void 0)return $=Q.length,this._cachedIndex=$,this.copySampleValue_($-1)}this._cachedIndex=$,this.intervalChanged_($,W,Z)}return this.interpolate_($,W,J,Z)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(J){let Q=this.resultBuffer,$=this.sampleValues,Z=this.valueSize,W=J*Z;for(let K=0;K!==Z;++K)Q[K]=$[W+K];return Q}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class CQ extends q9{constructor(J,Q,$,Z){super(J,Q,$,Z);this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(J,Q,$){let Z=this.parameterPositions,W=J-2,K=J+1,H=Z[W],Y=Z[K];if(H===void 0)switch(this.getSettings_().endingStart){case 2401:W=J,H=2*Q-$;break;case 2402:W=Z.length-2,H=Q+Z[W]-Z[W+1];break;default:W=J,H=$}if(Y===void 0)switch(this.getSettings_().endingEnd){case 2401:K=J,Y=2*$-Q;break;case 2402:K=1,Y=$+Z[1]-Z[0];break;default:K=J-1,Y=Q}let X=($-Q)*0.5,U=this.valueSize;this._weightPrev=X/(Q-H),this._weightNext=X/(Y-$),this._offsetPrev=W*U,this._offsetNext=K*U}interpolate_(J,Q,$,Z){let W=this.resultBuffer,K=this.sampleValues,H=this.valueSize,Y=J*H,X=Y-H,U=this._offsetPrev,E=this._offsetNext,G=this._weightPrev,N=this._weightNext,O=($-Q)/(Z-Q),M=O*O,k=M*O,q=-G*k+2*G*M-G*O,D=(1+G)*k+(-1.5-2*G)*M+(-0.5+G)*O+1,P=(-1-N)*k+(1.5+N)*M+0.5*O,V=N*k-N*M;for(let I=0;I!==H;++I)W[I]=q*K[U+I]+D*K[X+I]+P*K[Y+I]+V*K[E+I];return W}}class wQ extends q9{constructor(J,Q,$,Z){super(J,Q,$,Z)}interpolate_(J,Q,$,Z){let W=this.resultBuffer,K=this.sampleValues,H=this.valueSize,Y=J*H,X=Y-H,U=($-Q)/(Z-Q),E=1-U;for(let G=0;G!==H;++G)W[G]=K[X+G]*E+K[Y+G]*U;return W}}class PQ extends q9{constructor(J,Q,$,Z){super(J,Q,$,Z)}interpolate_(J){return this.copySampleValue_(J-1)}}class h0{constructor(J,Q,$,Z){if(J===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(Q===void 0||Q.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+J);this.name=J,this.times=q6(Q,this.TimeBufferType),this.values=q6($,this.ValueBufferType),this.setInterpolation(Z||this.DefaultInterpolation)}static toJSON(J){let Q=J.constructor,$;if(Q.toJSON!==this.toJSON)$=Q.toJSON(J);else{$={name:J.name,times:q6(J.times,Array),values:q6(J.values,Array)};let Z=J.getInterpolation();if(Z!==J.DefaultInterpolation)$.interpolation=Z}return $.type=J.ValueTypeName,$}InterpolantFactoryMethodDiscrete(J){return new PQ(this.times,this.values,this.getValueSize(),J)}InterpolantFactoryMethodLinear(J){return new wQ(this.times,this.values,this.getValueSize(),J)}InterpolantFactoryMethodSmooth(J){return new CQ(this.times,this.values,this.getValueSize(),J)}setInterpolation(J){let Q;switch(J){case 2300:Q=this.InterpolantFactoryMethodDiscrete;break;case 2301:Q=this.InterpolantFactoryMethodLinear;break;case 2302:Q=this.InterpolantFactoryMethodSmooth;break}if(Q===void 0){let $="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(J!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error($);return console.warn("THREE.KeyframeTrack:",$),this}return this.createInterpolant=Q,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return 2300;case this.InterpolantFactoryMethodLinear:return 2301;case this.InterpolantFactoryMethodSmooth:return 2302}}getValueSize(){return this.values.length/this.times.length}shift(J){if(J!==0){let Q=this.times;for(let $=0,Z=Q.length;$!==Z;++$)Q[$]+=J}return this}scale(J){if(J!==1){let Q=this.times;for(let $=0,Z=Q.length;$!==Z;++$)Q[$]*=J}return this}trim(J,Q){let $=this.times,Z=$.length,W=0,K=Z-1;while(W!==Z&&$[W]<J)++W;while(K!==-1&&$[K]>Q)--K;if(++K,W!==0||K!==Z){if(W>=K)K=Math.max(K,1),W=K-1;let H=this.getValueSize();this.times=$.slice(W,K),this.values=this.values.slice(W*H,K*H)}return this}validate(){let J=!0,Q=this.getValueSize();if(Q-Math.floor(Q)!==0)console.error("THREE.KeyframeTrack: Invalid value size in track.",this),J=!1;let $=this.times,Z=this.values,W=$.length;if(W===0)console.error("THREE.KeyframeTrack: Track is empty.",this),J=!1;let K=null;for(let H=0;H!==W;H++){let Y=$[H];if(typeof Y==="number"&&isNaN(Y)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,H,Y),J=!1;break}if(K!==null&&K>Y){console.error("THREE.KeyframeTrack: Out of order keys.",this,H,Y,K),J=!1;break}K=Y}if(Z!==void 0){if(WK(Z))for(let H=0,Y=Z.length;H!==Y;++H){let X=Z[H];if(isNaN(X)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,H,X),J=!1;break}}}return J}optimize(){let J=this.times.slice(),Q=this.values.slice(),$=this.getValueSize(),Z=this.getInterpolation()===2302,W=J.length-1,K=1;for(let H=1;H<W;++H){let Y=!1,X=J[H],U=J[H+1];if(X!==U&&(H!==1||X!==J[0]))if(!Z){let E=H*$,G=E-$,N=E+$;for(let O=0;O!==$;++O){let M=Q[E+O];if(M!==Q[G+O]||M!==Q[N+O]){Y=!0;break}}}else Y=!0;if(Y){if(H!==K){J[K]=J[H];let E=H*$,G=K*$;for(let N=0;N!==$;++N)Q[G+N]=Q[E+N]}++K}}if(W>0){J[K]=J[W];for(let H=W*$,Y=K*$,X=0;X!==$;++X)Q[Y+X]=Q[H+X];++K}if(K!==J.length)this.times=J.slice(0,K),this.values=Q.slice(0,K*$);else this.times=J,this.values=Q;return this}clone(){let J=this.times.slice(),Q=this.values.slice(),Z=new this.constructor(this.name,J,Q);return Z.createInterpolant=this.createInterpolant,Z}}h0.prototype.ValueTypeName="";h0.prototype.TimeBufferType=Float32Array;h0.prototype.ValueBufferType=Float32Array;h0.prototype.DefaultInterpolation=2301;class f8 extends h0{constructor(J,Q,$){super(J,Q,$)}}f8.prototype.ValueTypeName="bool";f8.prototype.ValueBufferType=Array;f8.prototype.DefaultInterpolation=2300;f8.prototype.InterpolantFactoryMethodLinear=void 0;f8.prototype.InterpolantFactoryMethodSmooth=void 0;class AQ extends h0{constructor(J,Q,$,Z){super(J,Q,$,Z)}}AQ.prototype.ValueTypeName="color";class TQ extends h0{constructor(J,Q,$,Z){super(J,Q,$,Z)}}TQ.prototype.ValueTypeName="number";class SQ extends q9{constructor(J,Q,$,Z){super(J,Q,$,Z)}interpolate_(J,Q,$,Z){let W=this.resultBuffer,K=this.sampleValues,H=this.valueSize,Y=($-Q)/(Z-Q),X=J*H;for(let U=X+H;X!==U;X+=4)M8.slerpFlat(W,0,K,X-H,K,X,Y);return W}}class c6 extends h0{constructor(J,Q,$,Z){super(J,Q,$,Z)}InterpolantFactoryMethodLinear(J){return new SQ(this.times,this.values,this.getValueSize(),J)}}c6.prototype.ValueTypeName="quaternion";c6.prototype.InterpolantFactoryMethodSmooth=void 0;class b8 extends h0{constructor(J,Q,$){super(J,Q,$)}}b8.prototype.ValueTypeName="string";b8.prototype.ValueBufferType=Array;b8.prototype.DefaultInterpolation=2300;b8.prototype.InterpolantFactoryMethodLinear=void 0;b8.prototype.InterpolantFactoryMethodSmooth=void 0;class jQ extends h0{constructor(J,Q,$,Z){super(J,Q,$,Z)}}jQ.prototype.ValueTypeName="vector";class yQ{constructor(J,Q,$){let Z=this,W=!1,K=0,H=0,Y=void 0,X=[];this.onStart=void 0,this.onLoad=J,this.onProgress=Q,this.onError=$,this.abortController=new AbortController,this.itemStart=function(U){if(H++,W===!1){if(Z.onStart!==void 0)Z.onStart(U,K,H)}W=!0},this.itemEnd=function(U){if(K++,Z.onProgress!==void 0)Z.onProgress(U,K,H);if(K===H){if(W=!1,Z.onLoad!==void 0)Z.onLoad()}},this.itemError=function(U){if(Z.onError!==void 0)Z.onError(U)},this.resolveURL=function(U){if(Y)return Y(U);return U},this.setURLModifier=function(U){return Y=U,this},this.addHandler=function(U,E){return X.push(U,E),this},this.removeHandler=function(U){let E=X.indexOf(U);if(E!==-1)X.splice(E,2);return this},this.getHandler=function(U){for(let E=0,G=X.length;E<G;E+=2){let N=X[E],O=X[E+1];if(N.global)N.lastIndex=0;if(N.test(U))return O}return null},this.abort=function(){return this.abortController.abort(),this.abortController=new AbortController,this}}}var gZ=new yQ;class vQ{constructor(J){this.manager=J!==void 0?J:gZ,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(J,Q){let $=this;return new Promise(function(Z,W){$.load(J,Z,Q,W)})}parse(){}setCrossOrigin(J){return this.crossOrigin=J,this}setWithCredentials(J){return this.withCredentials=J,this}setPath(J){return this.path=J,this}setResourcePath(J){return this.resourcePath=J,this}setRequestHeader(J){return this.requestHeader=J,this}abort(){return this}}vQ.DEFAULT_MATERIAL_NAME="__DEFAULT";class fQ extends h6{constructor(J=-1,Q=1,$=1,Z=-1,W=0.1,K=2000){super();this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=J,this.right=Q,this.top=$,this.bottom=Z,this.near=W,this.far=K,this.updateProjectionMatrix()}copy(J,Q){return super.copy(J,Q),this.left=J.left,this.right=J.right,this.top=J.top,this.bottom=J.bottom,this.near=J.near,this.far=J.far,this.zoom=J.zoom,this.view=J.view===null?null:Object.assign({},J.view),this}setViewOffset(J,Q,$,Z,W,K){if(this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=J,this.view.fullHeight=Q,this.view.offsetX=$,this.view.offsetY=Z,this.view.width=W,this.view.height=K,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let J=(this.right-this.left)/(2*this.zoom),Q=(this.top-this.bottom)/(2*this.zoom),$=(this.right+this.left)/2,Z=(this.top+this.bottom)/2,W=$-J,K=$+J,H=Z+Q,Y=Z-Q;if(this.view!==null&&this.view.enabled){let X=(this.right-this.left)/this.view.fullWidth/this.zoom,U=(this.top-this.bottom)/this.view.fullHeight/this.zoom;W+=X*this.view.offsetX,K=W+X*this.view.width,H-=U*this.view.offsetY,Y=H-U*this.view.height}this.projectionMatrix.makeOrthographic(W,K,H,Y,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(J){let Q=super.toJSON(J);if(Q.object.zoom=this.zoom,Q.object.left=this.left,Q.object.right=this.right,Q.object.top=this.top,Q.object.bottom=this.bottom,Q.object.near=this.near,Q.object.far=this.far,this.view!==null)Q.object.view=Object.assign({},this.view);return Q}}class bQ extends L0{constructor(J=[]){super();this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=J}}var hQ="\\[\\]\\.:\\/",KK=new RegExp("["+hQ+"]","g"),xQ="[^"+hQ+"]",YK="[^"+hQ.replace("\\.","")+"]",HK=/((?:WC+[\/:])*)/.source.replace("WC",xQ),XK=/(WCOD+)?/.source.replace("WCOD",YK),UK=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",xQ),GK=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",xQ),EK=new RegExp("^"+HK+XK+UK+GK+"$"),NK=["material","materials","bones","map"];class pZ{constructor(J,Q,$){let Z=$||uJ.parseTrackName(Q);this._targetGroup=J,this._bindings=J.subscribe_(Q,Z)}getValue(J,Q){this.bind();let $=this._targetGroup.nCachedObjects_,Z=this._bindings[$];if(Z!==void 0)Z.getValue(J,Q)}setValue(J,Q){let $=this._bindings;for(let Z=this._targetGroup.nCachedObjects_,W=$.length;Z!==W;++Z)$[Z].setValue(J,Q)}bind(){let J=this._bindings;for(let Q=this._targetGroup.nCachedObjects_,$=J.length;Q!==$;++Q)J[Q].bind()}unbind(){let J=this._bindings;for(let Q=this._targetGroup.nCachedObjects_,$=J.length;Q!==$;++Q)J[Q].unbind()}}class uJ{constructor(J,Q,$){this.path=Q,this.parsedPath=$||uJ.parseTrackName(Q),this.node=uJ.findNode(J,this.parsedPath.nodeName),this.rootNode=J,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(J,Q,$){if(!(J&&J.isAnimationObjectGroup))return new uJ(J,Q,$);else return new uJ.Composite(J,Q,$)}static sanitizeNodeName(J){return J.replace(/\s/g,"_").replace(KK,"")}static parseTrackName(J){let Q=EK.exec(J);if(Q===null)throw new Error("PropertyBinding: Cannot parse trackName: "+J);let $={nodeName:Q[2],objectName:Q[3],objectIndex:Q[4],propertyName:Q[5],propertyIndex:Q[6]},Z=$.nodeName&&$.nodeName.lastIndexOf(".");if(Z!==void 0&&Z!==-1){let W=$.nodeName.substring(Z+1);if(NK.indexOf(W)!==-1)$.nodeName=$.nodeName.substring(0,Z),$.objectName=W}if($.propertyName===null||$.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+J);return $}static findNode(J,Q){if(Q===void 0||Q===""||Q==="."||Q===-1||Q===J.name||Q===J.uuid)return J;if(J.skeleton){let $=J.skeleton.getBoneByName(Q);if($!==void 0)return $}if(J.children){let $=function(W){for(let K=0;K<W.length;K++){let H=W[K];if(H.name===Q||H.uuid===Q)return H;let Y=$(H.children);if(Y)return Y}return null},Z=$(J.children);if(Z)return Z}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(J,Q){J[Q]=this.targetObject[this.propertyName]}_getValue_array(J,Q){let $=this.resolvedProperty;for(let Z=0,W=$.length;Z!==W;++Z)J[Q++]=$[Z]}_getValue_arrayElement(J,Q){J[Q]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(J,Q){this.resolvedProperty.toArray(J,Q)}_setValue_direct(J,Q){this.targetObject[this.propertyName]=J[Q]}_setValue_direct_setNeedsUpdate(J,Q){this.targetObject[this.propertyName]=J[Q],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(J,Q){this.targetObject[this.propertyName]=J[Q],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(J,Q){let $=this.resolvedProperty;for(let Z=0,W=$.length;Z!==W;++Z)$[Z]=J[Q++]}_setValue_array_setNeedsUpdate(J,Q){let $=this.resolvedProperty;for(let Z=0,W=$.length;Z!==W;++Z)$[Z]=J[Q++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(J,Q){let $=this.resolvedProperty;for(let Z=0,W=$.length;Z!==W;++Z)$[Z]=J[Q++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(J,Q){this.resolvedProperty[this.propertyIndex]=J[Q]}_setValue_arrayElement_setNeedsUpdate(J,Q){this.resolvedProperty[this.propertyIndex]=J[Q],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(J,Q){this.resolvedProperty[this.propertyIndex]=J[Q],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(J,Q){this.resolvedProperty.fromArray(J,Q)}_setValue_fromArray_setNeedsUpdate(J,Q){this.resolvedProperty.fromArray(J,Q),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(J,Q){this.resolvedProperty.fromArray(J,Q),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(J,Q){this.bind(),this.getValue(J,Q)}_setValue_unbound(J,Q){this.bind(),this.setValue(J,Q)}bind(){let J=this.node,Q=this.parsedPath,$=Q.objectName,Z=Q.propertyName,W=Q.propertyIndex;if(!J)J=uJ.findNode(this.rootNode,Q.nodeName),this.node=J;if(this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!J){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if($){let X=Q.objectIndex;switch($){case"materials":if(!J.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!J.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}J=J.material.materials;break;case"bones":if(!J.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}J=J.skeleton.bones;for(let U=0;U<J.length;U++)if(J[U].name===X){X=U;break}break;case"map":if("map"in J){J=J.map;break}if(!J.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!J.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}J=J.material.map;break;default:if(J[$]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}J=J[$]}if(X!==void 0){if(J[X]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,J);return}J=J[X]}}let K=J[Z];if(K===void 0){let X=Q.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+X+"."+Z+" but it wasn't found.",J);return}let H=this.Versioning.None;if(this.targetObject=J,J.isMaterial===!0)H=this.Versioning.NeedsUpdate;else if(J.isObject3D===!0)H=this.Versioning.MatrixWorldNeedsUpdate;let Y=this.BindingType.Direct;if(W!==void 0){if(Z==="morphTargetInfluences"){if(!J.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!J.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}if(J.morphTargetDictionary[W]!==void 0)W=J.morphTargetDictionary[W]}Y=this.BindingType.ArrayElement,this.resolvedProperty=K,this.propertyIndex=W}else if(K.fromArray!==void 0&&K.toArray!==void 0)Y=this.BindingType.HasFromToArray,this.resolvedProperty=K;else if(Array.isArray(K))Y=this.BindingType.EntireArray,this.resolvedProperty=K;else this.propertyName=Z;this.getValue=this.GetterByBindingType[Y],this.setValue=this.SetterByBindingTypeAndVersioning[Y][H]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}uJ.Composite=pZ;uJ.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};uJ.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};uJ.prototype.GetterByBindingType=[uJ.prototype._getValue_direct,uJ.prototype._getValue_array,uJ.prototype._getValue_arrayElement,uJ.prototype._getValue_toArray];uJ.prototype.SetterByBindingTypeAndVersioning=[[uJ.prototype._setValue_direct,uJ.prototype._setValue_direct_setNeedsUpdate,uJ.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[uJ.prototype._setValue_array,uJ.prototype._setValue_array_setNeedsUpdate,uJ.prototype._setValue_array_setMatrixWorldNeedsUpdate],[uJ.prototype._setValue_arrayElement,uJ.prototype._setValue_arrayElement_setNeedsUpdate,uJ.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[uJ.prototype._setValue_fromArray,uJ.prototype._setValue_fromArray_setNeedsUpdate,uJ.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var oU=new Float32Array(1);function gQ(J,Q,$,Z){let W=qK(Z);switch($){case 1021:return J*Q;case 1028:return J*Q/W.components*W.byteLength;case 1029:return J*Q/W.components*W.byteLength;case 1030:return J*Q*2/W.components*W.byteLength;case 1031:return J*Q*2/W.components*W.byteLength;case 1022:return J*Q*3/W.components*W.byteLength;case 1023:return J*Q*4/W.components*W.byteLength;case 1033:return J*Q*4/W.components*W.byteLength;case 33776:case 33777:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*8;case 33778:case 33779:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*16;case 35841:case 35843:return Math.max(J,16)*Math.max(Q,8)/4;case 35840:case 35842:return Math.max(J,8)*Math.max(Q,8)/2;case 36196:case 37492:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*8;case 37496:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*16;case 37808:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*16;case 37809:return Math.floor((J+4)/5)*Math.floor((Q+3)/4)*16;case 37810:return Math.floor((J+4)/5)*Math.floor((Q+4)/5)*16;case 37811:return Math.floor((J+5)/6)*Math.floor((Q+4)/5)*16;case 37812:return Math.floor((J+5)/6)*Math.floor((Q+5)/6)*16;case 37813:return Math.floor((J+7)/8)*Math.floor((Q+4)/5)*16;case 37814:return Math.floor((J+7)/8)*Math.floor((Q+5)/6)*16;case 37815:return Math.floor((J+7)/8)*Math.floor((Q+7)/8)*16;case 37816:return Math.floor((J+9)/10)*Math.floor((Q+4)/5)*16;case 37817:return Math.floor((J+9)/10)*Math.floor((Q+5)/6)*16;case 37818:return Math.floor((J+9)/10)*Math.floor((Q+7)/8)*16;case 37819:return Math.floor((J+9)/10)*Math.floor((Q+9)/10)*16;case 37820:return Math.floor((J+11)/12)*Math.floor((Q+9)/10)*16;case 37821:return Math.floor((J+11)/12)*Math.floor((Q+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(J/4)*Math.ceil(Q/4)*16;case 36283:case 36284:return Math.ceil(J/4)*Math.ceil(Q/4)*8;case 36285:case 36286:return Math.ceil(J/4)*Math.ceil(Q/4)*16}throw new Error(`Unable to determine texture byte length for ${$} format.`)}function qK(J){switch(J){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${J}.`)}if(typeof __THREE_DEVTOOLS__!=="undefined")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"180"}}));if(typeof window!=="undefined")if(window.__THREE__)console.warn("WARNING: Multiple instances of Three.js being imported.");else window.__THREE__="180";function GW(){let J=null,Q=!1,$=null,Z=null;function W(K,H){$(K,H),Z=J.requestAnimationFrame(W)}return{start:function(){if(Q===!0)return;if($===null)return;Z=J.requestAnimationFrame(W),Q=!0},stop:function(){J.cancelAnimationFrame(Z),Q=!1},setAnimationLoop:function(K){$=K},setContext:function(K){J=K}}}function DK(J){let Q=new WeakMap;function $(Y,X){let{array:U,usage:E}=Y,G=U.byteLength,N=J.createBuffer();J.bindBuffer(X,N),J.bufferData(X,U,E),Y.onUploadCallback();let O;if(U instanceof Float32Array)O=J.FLOAT;else if(typeof Float16Array!=="undefined"&&U instanceof Float16Array)O=J.HALF_FLOAT;else if(U instanceof Uint16Array)if(Y.isFloat16BufferAttribute)O=J.HALF_FLOAT;else O=J.UNSIGNED_SHORT;else if(U instanceof Int16Array)O=J.SHORT;else if(U instanceof Uint32Array)O=J.UNSIGNED_INT;else if(U instanceof Int32Array)O=J.INT;else if(U instanceof Int8Array)O=J.BYTE;else if(U instanceof Uint8Array)O=J.UNSIGNED_BYTE;else if(U instanceof Uint8ClampedArray)O=J.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+U);return{buffer:N,type:O,bytesPerElement:U.BYTES_PER_ELEMENT,version:Y.version,size:G}}function Z(Y,X,U){let{array:E,updateRanges:G}=X;if(J.bindBuffer(U,Y),G.length===0)J.bufferSubData(U,0,E);else{G.sort((O,M)=>O.start-M.start);let N=0;for(let O=1;O<G.length;O++){let M=G[N],k=G[O];if(k.start<=M.start+M.count+1)M.count=Math.max(M.count,k.start+k.count-M.start);else++N,G[N]=k}G.length=N+1;for(let O=0,M=G.length;O<M;O++){let k=G[O];J.bufferSubData(U,k.start*E.BYTES_PER_ELEMENT,E,k.start,k.count)}X.clearUpdateRanges()}X.onUploadCallback()}function W(Y){if(Y.isInterleavedBufferAttribute)Y=Y.data;return Q.get(Y)}function K(Y){if(Y.isInterleavedBufferAttribute)Y=Y.data;let X=Q.get(Y);if(X)J.deleteBuffer(X.buffer),Q.delete(Y)}function H(Y,X){if(Y.isInterleavedBufferAttribute)Y=Y.data;if(Y.isGLBufferAttribute){let E=Q.get(Y);if(!E||E.version<Y.version)Q.set(Y,{buffer:Y.buffer,type:Y.type,bytesPerElement:Y.elementSize,version:Y.version});return}let U=Q.get(Y);if(U===void 0)Q.set(Y,$(Y,X));else if(U.version<Y.version){if(U.size!==Y.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");Z(U.buffer,Y,X),U.version=Y.version}}return{get:W,remove:K,update:H}}var OK=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,RK=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,FK=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,MK=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,kK=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,VK=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,LK=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,zK=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,BK=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,IK=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,_K=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,CK=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,wK=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,PK=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,AK=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,TK=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,SK=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,jK=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,yK=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,vK=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,fK=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,bK=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,hK=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,xK=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,gK=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,pK=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,mK=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,dK=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,lK=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,uK=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,cK="gl_FragColor = linearToOutputTexel( gl_FragColor );",nK=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,sK=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,iK=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,oK=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,aK=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,rK=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,tK=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,eK=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,JY=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,QY=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,$Y=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ZY=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,WY=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,KY=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,YY=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,HY=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,XY=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,UY=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,GY=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,EY=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,NY=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,qY=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,DY=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,OY=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,RY=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,FY=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,MY=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,kY=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,VY=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,LY=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,zY=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,BY=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,IY=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_Y=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,CY=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,wY=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,PY=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,AY=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,TY=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,SY=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,jY=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,yY=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,vY=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fY=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bY=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,hY=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,xY=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,gY=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,pY=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,mY=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,dY=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,lY=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,uY=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,cY=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,nY=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,sY=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,iY=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,oY=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,aY=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,rY=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,tY=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,eY=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,JH=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,QH=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,$H=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,ZH=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,WH=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,KH=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,YH=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,HH=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,XH=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,UH=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,GH=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,EH=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,NH=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,qH=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,DH=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,OH=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,RH=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,FH=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,MH=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kH=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,VH=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,LH=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,zH=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,BH=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,IH=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,_H=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,CH=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wH=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,PH=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,AH=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,TH=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,SH=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,jH=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,yH=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vH=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,fH=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,bH=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,hH=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xH=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,gH=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pH=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mH=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dH=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,lH=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,uH=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cH=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,nH=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sH=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,fJ={alphahash_fragment:OK,alphahash_pars_fragment:RK,alphamap_fragment:FK,alphamap_pars_fragment:MK,alphatest_fragment:kK,alphatest_pars_fragment:VK,aomap_fragment:LK,aomap_pars_fragment:zK,batching_pars_vertex:BK,batching_vertex:IK,begin_vertex:_K,beginnormal_vertex:CK,bsdfs:wK,iridescence_fragment:PK,bumpmap_pars_fragment:AK,clipping_planes_fragment:TK,clipping_planes_pars_fragment:SK,clipping_planes_pars_vertex:jK,clipping_planes_vertex:yK,color_fragment:vK,color_pars_fragment:fK,color_pars_vertex:bK,color_vertex:hK,common:xK,cube_uv_reflection_fragment:gK,defaultnormal_vertex:pK,displacementmap_pars_vertex:mK,displacementmap_vertex:dK,emissivemap_fragment:lK,emissivemap_pars_fragment:uK,colorspace_fragment:cK,colorspace_pars_fragment:nK,envmap_fragment:sK,envmap_common_pars_fragment:iK,envmap_pars_fragment:oK,envmap_pars_vertex:aK,envmap_physical_pars_fragment:HY,envmap_vertex:rK,fog_vertex:tK,fog_pars_vertex:eK,fog_fragment:JY,fog_pars_fragment:QY,gradientmap_pars_fragment:$Y,lightmap_pars_fragment:ZY,lights_lambert_fragment:WY,lights_lambert_pars_fragment:KY,lights_pars_begin:YY,lights_toon_fragment:XY,lights_toon_pars_fragment:UY,lights_phong_fragment:GY,lights_phong_pars_fragment:EY,lights_physical_fragment:NY,lights_physical_pars_fragment:qY,lights_fragment_begin:DY,lights_fragment_maps:OY,lights_fragment_end:RY,logdepthbuf_fragment:FY,logdepthbuf_pars_fragment:MY,logdepthbuf_pars_vertex:kY,logdepthbuf_vertex:VY,map_fragment:LY,map_pars_fragment:zY,map_particle_fragment:BY,map_particle_pars_fragment:IY,metalnessmap_fragment:_Y,metalnessmap_pars_fragment:CY,morphinstance_vertex:wY,morphcolor_vertex:PY,morphnormal_vertex:AY,morphtarget_pars_vertex:TY,morphtarget_vertex:SY,normal_fragment_begin:jY,normal_fragment_maps:yY,normal_pars_fragment:vY,normal_pars_vertex:fY,normal_vertex:bY,normalmap_pars_fragment:hY,clearcoat_normal_fragment_begin:xY,clearcoat_normal_fragment_maps:gY,clearcoat_pars_fragment:pY,iridescence_pars_fragment:mY,opaque_fragment:dY,packing:lY,premultiplied_alpha_fragment:uY,project_vertex:cY,dithering_fragment:nY,dithering_pars_fragment:sY,roughnessmap_fragment:iY,roughnessmap_pars_fragment:oY,shadowmap_pars_fragment:aY,shadowmap_pars_vertex:rY,shadowmap_vertex:tY,shadowmask_pars_fragment:eY,skinbase_vertex:JH,skinning_pars_vertex:QH,skinning_vertex:$H,skinnormal_vertex:ZH,specularmap_fragment:WH,specularmap_pars_fragment:KH,tonemapping_fragment:YH,tonemapping_pars_fragment:HH,transmission_fragment:XH,transmission_pars_fragment:UH,uv_pars_fragment:GH,uv_pars_vertex:EH,uv_vertex:NH,worldpos_vertex:qH,background_vert:DH,background_frag:OH,backgroundCube_vert:RH,backgroundCube_frag:FH,cube_vert:MH,cube_frag:kH,depth_vert:VH,depth_frag:LH,distanceRGBA_vert:zH,distanceRGBA_frag:BH,equirect_vert:IH,equirect_frag:_H,linedashed_vert:CH,linedashed_frag:wH,meshbasic_vert:PH,meshbasic_frag:AH,meshlambert_vert:TH,meshlambert_frag:SH,meshmatcap_vert:jH,meshmatcap_frag:yH,meshnormal_vert:vH,meshnormal_frag:fH,meshphong_vert:bH,meshphong_frag:hH,meshphysical_vert:xH,meshphysical_frag:gH,meshtoon_vert:pH,meshtoon_frag:mH,points_vert:dH,points_frag:lH,shadow_vert:uH,shadow_frag:cH,sprite_vert:nH,sprite_frag:sH},ZJ={common:{diffuse:{value:new lJ(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new vJ},alphaMap:{value:null},alphaMapTransform:{value:new vJ},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new vJ}},envmap:{envMap:{value:null},envMapRotation:{value:new vJ},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:0.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new vJ}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new vJ}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new vJ},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new vJ},normalScale:{value:new cJ(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new vJ},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new vJ}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new vJ}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new vJ}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:0.00025},fogNear:{value:1},fogFar:{value:2000},fogColor:{value:new lJ(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new lJ(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new vJ},alphaTest:{value:0},uvTransform:{value:new vJ}},sprite:{diffuse:{value:new lJ(16777215)},opacity:{value:1},center:{value:new cJ(0.5,0.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new vJ},alphaMap:{value:null},alphaMapTransform:{value:new vJ},alphaTest:{value:0}}},r0={basic:{uniforms:k0([ZJ.common,ZJ.specularmap,ZJ.envmap,ZJ.aomap,ZJ.lightmap,ZJ.fog]),vertexShader:fJ.meshbasic_vert,fragmentShader:fJ.meshbasic_frag},lambert:{uniforms:k0([ZJ.common,ZJ.specularmap,ZJ.envmap,ZJ.aomap,ZJ.lightmap,ZJ.emissivemap,ZJ.bumpmap,ZJ.normalmap,ZJ.displacementmap,ZJ.fog,ZJ.lights,{emissive:{value:new lJ(0)}}]),vertexShader:fJ.meshlambert_vert,fragmentShader:fJ.meshlambert_frag},phong:{uniforms:k0([ZJ.common,ZJ.specularmap,ZJ.envmap,ZJ.aomap,ZJ.lightmap,ZJ.emissivemap,ZJ.bumpmap,ZJ.normalmap,ZJ.displacementmap,ZJ.fog,ZJ.lights,{emissive:{value:new lJ(0)},specular:{value:new lJ(1118481)},shininess:{value:30}}]),vertexShader:fJ.meshphong_vert,fragmentShader:fJ.meshphong_frag},standard:{uniforms:k0([ZJ.common,ZJ.envmap,ZJ.aomap,ZJ.lightmap,ZJ.emissivemap,ZJ.bumpmap,ZJ.normalmap,ZJ.displacementmap,ZJ.roughnessmap,ZJ.metalnessmap,ZJ.fog,ZJ.lights,{emissive:{value:new lJ(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:fJ.meshphysical_vert,fragmentShader:fJ.meshphysical_frag},toon:{uniforms:k0([ZJ.common,ZJ.aomap,ZJ.lightmap,ZJ.emissivemap,ZJ.bumpmap,ZJ.normalmap,ZJ.displacementmap,ZJ.gradientmap,ZJ.fog,ZJ.lights,{emissive:{value:new lJ(0)}}]),vertexShader:fJ.meshtoon_vert,fragmentShader:fJ.meshtoon_frag},matcap:{uniforms:k0([ZJ.common,ZJ.bumpmap,ZJ.normalmap,ZJ.displacementmap,ZJ.fog,{matcap:{value:null}}]),vertexShader:fJ.meshmatcap_vert,fragmentShader:fJ.meshmatcap_frag},points:{uniforms:k0([ZJ.points,ZJ.fog]),vertexShader:fJ.points_vert,fragmentShader:fJ.points_frag},dashed:{uniforms:k0([ZJ.common,ZJ.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:fJ.linedashed_vert,fragmentShader:fJ.linedashed_frag},depth:{uniforms:k0([ZJ.common,ZJ.displacementmap]),vertexShader:fJ.depth_vert,fragmentShader:fJ.depth_frag},normal:{uniforms:k0([ZJ.common,ZJ.bumpmap,ZJ.normalmap,ZJ.displacementmap,{opacity:{value:1}}]),vertexShader:fJ.meshnormal_vert,fragmentShader:fJ.meshnormal_frag},sprite:{uniforms:k0([ZJ.sprite,ZJ.fog]),vertexShader:fJ.sprite_vert,fragmentShader:fJ.sprite_frag},background:{uniforms:{uvTransform:{value:new vJ},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:fJ.background_vert,fragmentShader:fJ.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new vJ}},vertexShader:fJ.backgroundCube_vert,fragmentShader:fJ.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:fJ.cube_vert,fragmentShader:fJ.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:fJ.equirect_vert,fragmentShader:fJ.equirect_frag},distanceRGBA:{uniforms:k0([ZJ.common,ZJ.displacementmap,{referencePosition:{value:new f},nearDistance:{value:1},farDistance:{value:1000}}]),vertexShader:fJ.distanceRGBA_vert,fragmentShader:fJ.distanceRGBA_frag},shadow:{uniforms:k0([ZJ.lights,ZJ.fog,{color:{value:new lJ(0)},opacity:{value:1}}]),vertexShader:fJ.shadow_vert,fragmentShader:fJ.shadow_frag}};r0.physical={uniforms:k0([r0.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new vJ},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new vJ},clearcoatNormalScale:{value:new cJ(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new vJ},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new vJ},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new vJ},sheen:{value:0},sheenColor:{value:new lJ(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new vJ},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new vJ},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new vJ},transmissionSamplerSize:{value:new cJ},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new vJ},attenuationDistance:{value:0},attenuationColor:{value:new lJ(0)},specularColor:{value:new lJ(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new vJ},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new vJ},anisotropyVector:{value:new cJ},anisotropyMap:{value:null},anisotropyMapTransform:{value:new vJ}}]),vertexShader:fJ.meshphysical_vert,fragmentShader:fJ.meshphysical_frag};var n6={r:0,b:0,g:0},h8=new s0,iH=new W0;function oH(J,Q,$,Z,W,K,H){let Y=new lJ(0),X=K===!0?0:1,U,E,G=null,N=0,O=null;function M(V){let I=V.isScene===!0?V.background:null;if(I&&I.isTexture)I=(V.backgroundBlurriness>0?$:Q).get(I);return I}function k(V){let I=!1,S=M(V);if(S===null)D(Y,X);else if(S&&S.isColor)D(S,1),I=!0;let C=J.xr.getEnvironmentBlendMode();if(C==="additive")Z.buffers.color.setClear(0,0,0,1,H);else if(C==="alpha-blend")Z.buffers.color.setClear(0,0,0,0,H);if(J.autoClear||I)Z.buffers.depth.setTest(!0),Z.buffers.depth.setMask(!0),Z.buffers.color.setMask(!0),J.clear(J.autoClearColor,J.autoClearDepth,J.autoClearStencil)}function q(V,I){let S=M(I);if(S&&(S.isCubeTexture||S.mapping===P9)){if(E===void 0)E=new l0(new N9(1,1,1),new j0({name:"BackgroundCubeMaterial",uniforms:v8(r0.backgroundCube.uniforms),vertexShader:r0.backgroundCube.vertexShader,fragmentShader:r0.backgroundCube.fragmentShader,side:T0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),E.geometry.deleteAttribute("normal"),E.geometry.deleteAttribute("uv"),E.onBeforeRender=function(C,A,x){this.matrixWorld.copyPosition(x.matrixWorld)},Object.defineProperty(E.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),W.update(E);if(h8.copy(I.backgroundRotation),h8.x*=-1,h8.y*=-1,h8.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1)h8.y*=-1,h8.z*=-1;if(E.material.uniforms.envMap.value=S,E.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,E.material.uniforms.backgroundBlurriness.value=I.backgroundBlurriness,E.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,E.material.uniforms.backgroundRotation.value.setFromMatrix4(iH.makeRotationFromEuler(h8)),E.material.toneMapped=pJ.getTransfer(S.colorSpace)!==rJ,G!==S||N!==S.version||O!==J.toneMapping)E.material.needsUpdate=!0,G=S,N=S.version,O=J.toneMapping;E.layers.enableAll(),V.unshift(E,E.geometry,E.material,0,0,null)}else if(S&&S.isTexture){if(U===void 0)U=new l0(new x9(2,2),new j0({name:"BackgroundMaterial",uniforms:v8(r0.background.uniforms),vertexShader:r0.background.vertexShader,fragmentShader:r0.background.fragmentShader,side:W9,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),U.geometry.deleteAttribute("normal"),Object.defineProperty(U.material,"map",{get:function(){return this.uniforms.t2D.value}}),W.update(U);if(U.material.uniforms.t2D.value=S,U.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,U.material.toneMapped=pJ.getTransfer(S.colorSpace)!==rJ,S.matrixAutoUpdate===!0)S.updateMatrix();if(U.material.uniforms.uvTransform.value.copy(S.matrix),G!==S||N!==S.version||O!==J.toneMapping)U.material.needsUpdate=!0,G=S,N=S.version,O=J.toneMapping;U.layers.enableAll(),V.unshift(U,U.geometry,U.material,0,0,null)}}function D(V,I){V.getRGB(n6,MQ(J)),Z.buffers.color.setClear(n6.r,n6.g,n6.b,I,H)}function P(){if(E!==void 0)E.geometry.dispose(),E.material.dispose(),E=void 0;if(U!==void 0)U.geometry.dispose(),U.material.dispose(),U=void 0}return{getClearColor:function(){return Y},setClearColor:function(V,I=1){Y.set(V),X=I,D(Y,X)},getClearAlpha:function(){return X},setClearAlpha:function(V){X=V,D(Y,X)},render:k,addToRenderList:q,dispose:P}}function aH(J,Q){let $=J.getParameter(J.MAX_VERTEX_ATTRIBS),Z={},W=N(null),K=W,H=!1;function Y(L,T,d,c,m){let o=!1,l=G(c,d,T);if(K!==l)K=l,U(K.object);if(o=O(L,c,d,m),o)M(L,c,d,m);if(m!==null)Q.update(m,J.ELEMENT_ARRAY_BUFFER);if(o||H){if(H=!1,I(L,T,d,c),m!==null)J.bindBuffer(J.ELEMENT_ARRAY_BUFFER,Q.get(m).buffer)}}function X(){return J.createVertexArray()}function U(L){return J.bindVertexArray(L)}function E(L){return J.deleteVertexArray(L)}function G(L,T,d){let c=d.wireframe===!0,m=Z[L.id];if(m===void 0)m={},Z[L.id]=m;let o=m[T.id];if(o===void 0)o={},m[T.id]=o;let l=o[c];if(l===void 0)l=N(X()),o[c]=l;return l}function N(L){let T=[],d=[],c=[];for(let m=0;m<$;m++)T[m]=0,d[m]=0,c[m]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:T,enabledAttributes:d,attributeDivisors:c,object:L,attributes:{},index:null}}function O(L,T,d,c){let m=K.attributes,o=T.attributes,l=0,r=d.getAttributes();for(let g in r)if(r[g].location>=0){let GJ=m[g],PJ=o[g];if(PJ===void 0){if(g==="instanceMatrix"&&L.instanceMatrix)PJ=L.instanceMatrix;if(g==="instanceColor"&&L.instanceColor)PJ=L.instanceColor}if(GJ===void 0)return!0;if(GJ.attribute!==PJ)return!0;if(PJ&&GJ.data!==PJ.data)return!0;l++}if(K.attributesNum!==l)return!0;if(K.index!==c)return!0;return!1}function M(L,T,d,c){let m={},o=T.attributes,l=0,r=d.getAttributes();for(let g in r)if(r[g].location>=0){let GJ=o[g];if(GJ===void 0){if(g==="instanceMatrix"&&L.instanceMatrix)GJ=L.instanceMatrix;if(g==="instanceColor"&&L.instanceColor)GJ=L.instanceColor}let PJ={};if(PJ.attribute=GJ,GJ&&GJ.data)PJ.data=GJ.data;m[g]=PJ,l++}K.attributes=m,K.attributesNum=l,K.index=c}function k(){let L=K.newAttributes;for(let T=0,d=L.length;T<d;T++)L[T]=0}function q(L){D(L,0)}function D(L,T){let{newAttributes:d,enabledAttributes:c,attributeDivisors:m}=K;if(d[L]=1,c[L]===0)J.enableVertexAttribArray(L),c[L]=1;if(m[L]!==T)J.vertexAttribDivisor(L,T),m[L]=T}function P(){let{newAttributes:L,enabledAttributes:T}=K;for(let d=0,c=T.length;d<c;d++)if(T[d]!==L[d])J.disableVertexAttribArray(d),T[d]=0}function V(L,T,d,c,m,o,l){if(l===!0)J.vertexAttribIPointer(L,T,d,m,o);else J.vertexAttribPointer(L,T,d,c,m,o)}function I(L,T,d,c){k();let m=c.attributes,o=d.getAttributes(),l=T.defaultAttributeValues;for(let r in o){let g=o[r];if(g.location>=0){let KJ=m[r];if(KJ===void 0){if(r==="instanceMatrix"&&L.instanceMatrix)KJ=L.instanceMatrix;if(r==="instanceColor"&&L.instanceColor)KJ=L.instanceColor}if(KJ!==void 0){let{normalized:GJ,itemSize:PJ}=KJ,xJ=Q.get(KJ);if(xJ===void 0)continue;let{buffer:Y0,type:mJ,bytesPerElement:n}=xJ,WJ=mJ===J.INT||mJ===J.UNSIGNED_INT||KJ.gpuType===T7;if(KJ.isInterleavedBufferAttribute){let QJ=KJ.data,MJ=QJ.stride,TJ=KJ.offset;if(QJ.isInstancedInterleavedBuffer){for(let SJ=0;SJ<g.locationSize;SJ++)D(g.location+SJ,QJ.meshPerAttribute);if(L.isInstancedMesh!==!0&&c._maxInstanceCount===void 0)c._maxInstanceCount=QJ.meshPerAttribute*QJ.count}else for(let SJ=0;SJ<g.locationSize;SJ++)q(g.location+SJ);J.bindBuffer(J.ARRAY_BUFFER,Y0);for(let SJ=0;SJ<g.locationSize;SJ++)V(g.location+SJ,PJ/g.locationSize,mJ,GJ,MJ*n,(TJ+PJ/g.locationSize*SJ)*n,WJ)}else{if(KJ.isInstancedBufferAttribute){for(let QJ=0;QJ<g.locationSize;QJ++)D(g.location+QJ,KJ.meshPerAttribute);if(L.isInstancedMesh!==!0&&c._maxInstanceCount===void 0)c._maxInstanceCount=KJ.meshPerAttribute*KJ.count}else for(let QJ=0;QJ<g.locationSize;QJ++)q(g.location+QJ);J.bindBuffer(J.ARRAY_BUFFER,Y0);for(let QJ=0;QJ<g.locationSize;QJ++)V(g.location+QJ,PJ/g.locationSize,mJ,GJ,PJ*n,PJ/g.locationSize*QJ*n,WJ)}}else if(l!==void 0){let GJ=l[r];if(GJ!==void 0)switch(GJ.length){case 2:J.vertexAttrib2fv(g.location,GJ);break;case 3:J.vertexAttrib3fv(g.location,GJ);break;case 4:J.vertexAttrib4fv(g.location,GJ);break;default:J.vertexAttrib1fv(g.location,GJ)}}}}P()}function S(){x();for(let L in Z){let T=Z[L];for(let d in T){let c=T[d];for(let m in c)E(c[m].object),delete c[m];delete T[d]}delete Z[L]}}function C(L){if(Z[L.id]===void 0)return;let T=Z[L.id];for(let d in T){let c=T[d];for(let m in c)E(c[m].object),delete c[m];delete T[d]}delete Z[L.id]}function A(L){for(let T in Z){let d=Z[T];if(d[L.id]===void 0)continue;let c=d[L.id];for(let m in c)E(c[m].object),delete c[m];delete d[L.id]}}function x(){if(z(),H=!0,K===W)return;K=W,U(K.object)}function z(){W.geometry=null,W.program=null,W.wireframe=!1}return{setup:Y,reset:x,resetDefaultState:z,dispose:S,releaseStatesOfGeometry:C,releaseStatesOfProgram:A,initAttributes:k,enableAttribute:q,disableUnusedAttributes:P}}function rH(J,Q,$){let Z;function W(U){Z=U}function K(U,E){J.drawArrays(Z,U,E),$.update(E,Z,1)}function H(U,E,G){if(G===0)return;J.drawArraysInstanced(Z,U,E,G),$.update(E,Z,G)}function Y(U,E,G){if(G===0)return;Q.get("WEBGL_multi_draw").multiDrawArraysWEBGL(Z,U,0,E,0,G);let O=0;for(let M=0;M<G;M++)O+=E[M];$.update(O,Z,1)}function X(U,E,G,N){if(G===0)return;let O=Q.get("WEBGL_multi_draw");if(O===null)for(let M=0;M<U.length;M++)H(U[M],E[M],N[M]);else{O.multiDrawArraysInstancedWEBGL(Z,U,0,E,0,N,0,G);let M=0;for(let k=0;k<G;k++)M+=E[k]*N[k];$.update(M,Z,1)}}this.setMode=W,this.render=K,this.renderInstances=H,this.renderMultiDraw=Y,this.renderMultiDrawInstances=X}function tH(J,Q,$,Z){let W;function K(){if(W!==void 0)return W;if(Q.has("EXT_texture_filter_anisotropic")===!0){let A=Q.get("EXT_texture_filter_anisotropic");W=J.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else W=0;return W}function H(A){if(A!==a0&&Z.convert(A)!==J.getParameter(J.IMPLEMENTATION_COLOR_READ_FORMAT))return!1;return!0}function Y(A){let x=A===S9&&(Q.has("EXT_color_buffer_half_float")||Q.has("EXT_color_buffer_float"));if(A!==O8&&Z.convert(A)!==J.getParameter(J.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==R8&&!x)return!1;return!0}function X(A){if(A==="highp"){if(J.getShaderPrecisionFormat(J.VERTEX_SHADER,J.HIGH_FLOAT).precision>0&&J.getShaderPrecisionFormat(J.FRAGMENT_SHADER,J.HIGH_FLOAT).precision>0)return"highp";A="mediump"}if(A==="mediump"){if(J.getShaderPrecisionFormat(J.VERTEX_SHADER,J.MEDIUM_FLOAT).precision>0&&J.getShaderPrecisionFormat(J.FRAGMENT_SHADER,J.MEDIUM_FLOAT).precision>0)return"mediump"}return"lowp"}let U=$.precision!==void 0?$.precision:"highp",E=X(U);if(E!==U)console.warn("THREE.WebGLRenderer:",U,"not supported, using",E,"instead."),U=E;let G=$.logarithmicDepthBuffer===!0,N=$.reversedDepthBuffer===!0&&Q.has("EXT_clip_control"),O=J.getParameter(J.MAX_TEXTURE_IMAGE_UNITS),M=J.getParameter(J.MAX_VERTEX_TEXTURE_IMAGE_UNITS),k=J.getParameter(J.MAX_TEXTURE_SIZE),q=J.getParameter(J.MAX_CUBE_MAP_TEXTURE_SIZE),D=J.getParameter(J.MAX_VERTEX_ATTRIBS),P=J.getParameter(J.MAX_VERTEX_UNIFORM_VECTORS),V=J.getParameter(J.MAX_VARYING_VECTORS),I=J.getParameter(J.MAX_FRAGMENT_UNIFORM_VECTORS),S=M>0,C=J.getParameter(J.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:K,getMaxPrecision:X,textureFormatReadable:H,textureTypeReadable:Y,precision:U,logarithmicDepthBuffer:G,reversedDepthBuffer:N,maxTextures:O,maxVertexTextures:M,maxTextureSize:k,maxCubemapSize:q,maxAttributes:D,maxVertexUniforms:P,maxVaryings:V,maxFragmentUniforms:I,vertexTextures:S,maxSamples:C}}function eH(J){let Q=this,$=null,Z=0,W=!1,K=!1,H=new Z8,Y=new vJ,X={value:null,needsUpdate:!1};this.uniform=X,this.numPlanes=0,this.numIntersection=0,this.init=function(G,N){let O=G.length!==0||N||Z!==0||W;return W=N,Z=G.length,O},this.beginShadows=function(){K=!0,E(null)},this.endShadows=function(){K=!1},this.setGlobalState=function(G,N){$=E(G,N,0)},this.setState=function(G,N,O){let{clippingPlanes:M,clipIntersection:k,clipShadows:q}=G,D=J.get(G);if(!W||M===null||M.length===0||K&&!q)if(K)E(null);else U();else{let P=K?0:Z,V=P*4,I=D.clippingState||null;X.value=I,I=E(M,N,V,O);for(let S=0;S!==V;++S)I[S]=$[S];D.clippingState=I,this.numIntersection=k?this.numPlanes:0,this.numPlanes+=P}};function U(){if(X.value!==$)X.value=$,X.needsUpdate=Z>0;Q.numPlanes=Z,Q.numIntersection=0}function E(G,N,O,M){let k=G!==null?G.length:0,q=null;if(k!==0){if(q=X.value,M!==!0||q===null){let D=O+k*4,P=N.matrixWorldInverse;if(Y.getNormalMatrix(P),q===null||q.length<D)q=new Float32Array(D);for(let V=0,I=O;V!==k;++V,I+=4)H.copy(G[V]).applyMatrix4(P,Y),H.normal.toArray(q,I),q[I+3]=H.constant}X.value=q,X.needsUpdate=!0}return Q.numPlanes=k,Q.numIntersection=0,q}}function JX(J){let Q=new WeakMap;function $(H,Y){if(Y===I6)H.mapping=H9;else if(Y===_6)H.mapping=P8;return H}function Z(H){if(H&&H.isTexture){let Y=H.mapping;if(Y===I6||Y===_6)if(Q.has(H)){let X=Q.get(H).texture;return $(X,H.mapping)}else{let X=H.image;if(X&&X.height>0){let U=new VQ(X.height);return U.fromEquirectangularTexture(J,H),Q.set(H,U),H.addEventListener("dispose",W),$(U.texture,H.mapping)}else return null}}return H}function W(H){let Y=H.target;Y.removeEventListener("dispose",W);let X=Q.get(Y);if(X!==void 0)Q.delete(Y),X.dispose()}function K(){Q=new WeakMap}return{get:Z,dispose:K}}var O9=4,mZ=[0.125,0.215,0.35,0.446,0.526,0.582],p8=20,pQ=new fQ,dZ=new lJ,mQ=null,dQ=0,lQ=0,uQ=!1,g8=(1+Math.sqrt(5))/2,D9=1/g8,lZ=[new f(-g8,D9,0),new f(g8,D9,0),new f(-D9,0,g8),new f(D9,0,g8),new f(0,g8,-D9),new f(0,g8,D9),new f(-1,1,-1),new f(1,1,-1),new f(-1,1,1),new f(1,1,1)],QX=new f;class nQ{constructor(J){this._renderer=J,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(J,Q=0,$=0.1,Z=100,W={}){let{size:K=256,position:H=QX}=W;mQ=this._renderer.getRenderTarget(),dQ=this._renderer.getActiveCubeFace(),lQ=this._renderer.getActiveMipmapLevel(),uQ=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(K);let Y=this._allocateTargets();if(Y.depthBuffer=!0,this._sceneToCubeUV(J,$,Z,Y,H),Q>0)this._blur(Y,0,0,Q);return this._applyPMREM(Y),this._cleanup(Y),Y}fromEquirectangular(J,Q=null){return this._fromTexture(J,Q)}fromCubemap(J,Q=null){return this._fromTexture(J,Q)}compileCubemapShader(){if(this._cubemapMaterial===null)this._cubemapMaterial=nZ(),this._compileMaterial(this._cubemapMaterial)}compileEquirectangularShader(){if(this._equirectMaterial===null)this._equirectMaterial=cZ(),this._compileMaterial(this._equirectMaterial)}dispose(){if(this._dispose(),this._cubemapMaterial!==null)this._cubemapMaterial.dispose();if(this._equirectMaterial!==null)this._equirectMaterial.dispose()}_setSize(J){this._lodMax=Math.floor(Math.log2(J)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){if(this._blurMaterial!==null)this._blurMaterial.dispose();if(this._pingPongRenderTarget!==null)this._pingPongRenderTarget.dispose();for(let J=0;J<this._lodPlanes.length;J++)this._lodPlanes[J].dispose()}_cleanup(J){this._renderer.setRenderTarget(mQ,dQ,lQ),this._renderer.xr.enabled=uQ,J.scissorTest=!1,s6(J,0,0,J.width,J.height)}_fromTexture(J,Q){if(J.mapping===H9||J.mapping===P8)this._setSize(J.image.length===0?16:J.image[0].width||J.image[0].image.width);else this._setSize(J.image.width/4);mQ=this._renderer.getRenderTarget(),dQ=this._renderer.getActiveCubeFace(),lQ=this._renderer.getActiveMipmapLevel(),uQ=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let $=Q||this._allocateTargets();return this._textureToCubeUV(J,$),this._applyPMREM($),this._cleanup($),$}_allocateTargets(){let J=3*Math.max(this._cubeSize,112),Q=4*this._cubeSize,$={magFilter:A8,minFilter:A8,generateMipmaps:!1,type:S9,format:a0,colorSpace:y9,depthBuffer:!1},Z=uZ(J,Q,$);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==J||this._pingPongRenderTarget.height!==Q){if(this._pingPongRenderTarget!==null)this._dispose();this._pingPongRenderTarget=uZ(J,Q,$);let{_lodMax:W}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=$X(W)),this._blurMaterial=ZX(W,J,Q)}return Z}_compileMaterial(J){let Q=new l0(this._lodPlanes[0],J);this._renderer.compile(Q,pQ)}_sceneToCubeUV(J,Q,$,Z,W){let Y=new L0(90,1,Q,$),X=[1,-1,1,1,1,1],U=[1,1,1,-1,-1,-1],E=this._renderer,G=E.autoClear,N=E.toneMapping;if(E.getClearColor(dZ),E.toneMapping=K8,E.autoClear=!1,E.state.buffers.depth.getReversed())E.setRenderTarget(Z),E.clearDepth(),E.setRenderTarget(null);let M=new v6({name:"PMREM.Background",side:T0,depthWrite:!1,depthTest:!1}),k=new l0(new N9,M),q=!1,D=J.background;if(D){if(D.isColor)M.color.copy(D),J.background=null,q=!0}else M.color.copy(dZ),q=!0;for(let P=0;P<6;P++){let V=P%3;if(V===0)Y.up.set(0,X[P],0),Y.position.set(W.x,W.y,W.z),Y.lookAt(W.x+U[P],W.y,W.z);else if(V===1)Y.up.set(0,0,X[P]),Y.position.set(W.x,W.y,W.z),Y.lookAt(W.x,W.y+U[P],W.z);else Y.up.set(0,X[P],0),Y.position.set(W.x,W.y,W.z),Y.lookAt(W.x,W.y,W.z+U[P]);let I=this._cubeSize;if(s6(Z,V*I,P>2?I:0,I,I),E.setRenderTarget(Z),q)E.render(k,Y);E.render(J,Y)}k.geometry.dispose(),k.material.dispose(),E.toneMapping=N,E.autoClear=G,J.background=D}_textureToCubeUV(J,Q){let $=this._renderer,Z=J.mapping===H9||J.mapping===P8;if(Z){if(this._cubemapMaterial===null)this._cubemapMaterial=nZ();this._cubemapMaterial.uniforms.flipEnvMap.value=J.isRenderTargetTexture===!1?-1:1}else if(this._equirectMaterial===null)this._equirectMaterial=cZ();let W=Z?this._cubemapMaterial:this._equirectMaterial,K=new l0(this._lodPlanes[0],W),H=W.uniforms;H.envMap.value=J;let Y=this._cubeSize;s6(Q,0,0,3*Y,2*Y),$.setRenderTarget(Q),$.render(K,pQ)}_applyPMREM(J){let Q=this._renderer,$=Q.autoClear;Q.autoClear=!1;let Z=this._lodPlanes.length;for(let W=1;W<Z;W++){let K=Math.sqrt(this._sigmas[W]*this._sigmas[W]-this._sigmas[W-1]*this._sigmas[W-1]),H=lZ[(Z-W-1)%lZ.length];this._blur(J,W-1,W,K,H)}Q.autoClear=$}_blur(J,Q,$,Z,W){let K=this._pingPongRenderTarget;this._halfBlur(J,K,Q,$,Z,"latitudinal",W),this._halfBlur(K,J,$,$,Z,"longitudinal",W)}_halfBlur(J,Q,$,Z,W,K,H){let Y=this._renderer,X=this._blurMaterial;if(K!=="latitudinal"&&K!=="longitudinal")console.error("blur direction must be either latitudinal or longitudinal!");let U=3,E=new l0(this._lodPlanes[Z],X),G=X.uniforms,N=this._sizeLods[$]-1,O=isFinite(W)?Math.PI/(2*N):2*Math.PI/(2*p8-1),M=W/O,k=isFinite(W)?1+Math.floor(U*M):p8;if(k>p8)console.warn(`sigmaRadians, ${W}, is too large and will clip, as it requested ${k} samples when the maximum is set to ${p8}`);let q=[],D=0;for(let C=0;C<p8;++C){let A=C/M,x=Math.exp(-A*A/2);if(q.push(x),C===0)D+=x;else if(C<k)D+=2*x}for(let C=0;C<q.length;C++)q[C]=q[C]/D;if(G.envMap.value=J.texture,G.samples.value=k,G.weights.value=q,G.latitudinal.value=K==="latitudinal",H)G.poleAxis.value=H;let{_lodMax:P}=this;G.dTheta.value=O,G.mipInt.value=P-$;let V=this._sizeLods[Z],I=3*V*(Z>P-O9?Z-P+O9:0),S=4*(this._cubeSize-V);s6(Q,I,S,3*V,2*V),Y.setRenderTarget(Q),Y.render(E,pQ)}}function $X(J){let Q=[],$=[],Z=[],W=J,K=J-O9+1+mZ.length;for(let H=0;H<K;H++){let Y=Math.pow(2,W);$.push(Y);let X=1/Y;if(H>J-O9)X=mZ[H-J+O9-1];else if(H===0)X=0;Z.push(X);let U=1/(Y-2),E=-U,G=1+U,N=[E,E,G,E,G,G,E,E,G,G,E,G],O=6,M=6,k=3,q=2,D=1,P=new Float32Array(k*M*O),V=new Float32Array(q*M*O),I=new Float32Array(D*M*O);for(let C=0;C<O;C++){let A=C%3*2/3-1,x=C>2?0:-1,z=[A,x,0,A+0.6666666666666666,x,0,A+0.6666666666666666,x+1,0,A,x,0,A+0.6666666666666666,x+1,0,A,x+1,0];P.set(z,k*M*C),V.set(N,q*M*C);let L=[C,C,C,C,C,C];I.set(L,D*M*C)}let S=new S0;if(S.setAttribute("position",new aJ(P,k)),S.setAttribute("uv",new aJ(V,q)),S.setAttribute("faceIndex",new aJ(I,D)),Q.push(S),W>O9)W--}return{lodPlanes:Q,sizeLods:$,sigmas:Z}}function uZ(J,Q,$){let Z=new Y8(J,Q,$);return Z.texture.mapping=P9,Z.texture.name="PMREM.cubeUv",Z.scissorTest=!0,Z}function s6(J,Q,$,Z,W){J.viewport.set(Q,$,Z,W),J.scissor.set(Q,$,Z,W)}function ZX(J,Q,$){let Z=new Float32Array(p8),W=new f(0,1,0);return new j0({name:"SphericalGaussianBlur",defines:{n:p8,CUBEUV_TEXEL_WIDTH:1/Q,CUBEUV_TEXEL_HEIGHT:1/$,CUBEUV_MAX_MIP:`${J}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:Z},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:W}},vertexShader:iQ(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:D8,depthTest:!1,depthWrite:!1})}function cZ(){return new j0({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:iQ(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:D8,depthTest:!1,depthWrite:!1})}function nZ(){return new j0({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:iQ(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:D8,depthTest:!1,depthWrite:!1})}function iQ(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function WX(J){let Q=new WeakMap,$=null;function Z(Y){if(Y&&Y.isTexture){let X=Y.mapping,U=X===I6||X===_6,E=X===H9||X===P8;if(U||E){let G=Q.get(Y),N=G!==void 0?G.texture.pmremVersion:0;if(Y.isRenderTargetTexture&&Y.pmremVersion!==N){if($===null)$=new nQ(J);return G=U?$.fromEquirectangular(Y,G):$.fromCubemap(Y,G),G.texture.pmremVersion=Y.pmremVersion,Q.set(Y,G),G.texture}else if(G!==void 0)return G.texture;else{let O=Y.image;if(U&&O&&O.height>0||E&&O&&W(O)){if($===null)$=new nQ(J);return G=U?$.fromEquirectangular(Y):$.fromCubemap(Y),G.texture.pmremVersion=Y.pmremVersion,Q.set(Y,G),Y.addEventListener("dispose",K),G.texture}else return null}}}return Y}function W(Y){let X=0,U=6;for(let E=0;E<U;E++)if(Y[E]!==void 0)X++;return X===U}function K(Y){let X=Y.target;X.removeEventListener("dispose",K);let U=Q.get(X);if(U!==void 0)Q.delete(X),U.dispose()}function H(){if(Q=new WeakMap,$!==null)$.dispose(),$=null}return{get:Z,dispose:H}}function KX(J){let Q={};function $(Z){if(Q[Z]!==void 0)return Q[Z];let W;switch(Z){case"WEBGL_depth_texture":W=J.getExtension("WEBGL_depth_texture")||J.getExtension("MOZ_WEBGL_depth_texture")||J.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":W=J.getExtension("EXT_texture_filter_anisotropic")||J.getExtension("MOZ_EXT_texture_filter_anisotropic")||J.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":W=J.getExtension("WEBGL_compressed_texture_s3tc")||J.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||J.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":W=J.getExtension("WEBGL_compressed_texture_pvrtc")||J.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:W=J.getExtension(Z)}return Q[Z]=W,W}return{has:function(Z){return $(Z)!==null},init:function(){$("EXT_color_buffer_float"),$("WEBGL_clip_cull_distance"),$("OES_texture_float_linear"),$("EXT_color_buffer_half_float"),$("WEBGL_multisampled_render_to_texture"),$("WEBGL_render_shared_exponent")},get:function(Z){let W=$(Z);if(W===null)Z9("THREE.WebGLRenderer: "+Z+" extension not supported.");return W}}}function YX(J,Q,$,Z){let W={},K=new WeakMap;function H(G){let N=G.target;if(N.index!==null)Q.remove(N.index);for(let M in N.attributes)Q.remove(N.attributes[M]);N.removeEventListener("dispose",H),delete W[N.id];let O=K.get(N);if(O)Q.remove(O),K.delete(N);if(Z.releaseStatesOfGeometry(N),N.isInstancedBufferGeometry===!0)delete N._maxInstanceCount;$.memory.geometries--}function Y(G,N){if(W[N.id]===!0)return N;return N.addEventListener("dispose",H),W[N.id]=!0,$.memory.geometries++,N}function X(G){let N=G.attributes;for(let O in N)Q.update(N[O],J.ARRAY_BUFFER)}function U(G){let N=[],O=G.index,M=G.attributes.position,k=0;if(O!==null){let P=O.array;k=O.version;for(let V=0,I=P.length;V<I;V+=3){let S=P[V+0],C=P[V+1],A=P[V+2];N.push(S,C,C,A,A,S)}}else if(M!==void 0){let P=M.array;k=M.version;for(let V=0,I=P.length/3-1;V<I;V+=3){let S=V+0,C=V+1,A=V+2;N.push(S,C,C,A,A,S)}}else return;let q=new((DQ(N))?b6:f6)(N,1);q.version=k;let D=K.get(G);if(D)Q.remove(D);K.set(G,q)}function E(G){let N=K.get(G);if(N){let O=G.index;if(O!==null){if(N.version<O.version)U(G)}}else U(G);return K.get(G)}return{get:Y,update:X,getWireframeAttribute:E}}function HX(J,Q,$){let Z;function W(N){Z=N}let K,H;function Y(N){K=N.type,H=N.bytesPerElement}function X(N,O){J.drawElements(Z,O,K,N*H),$.update(O,Z,1)}function U(N,O,M){if(M===0)return;J.drawElementsInstanced(Z,O,K,N*H,M),$.update(O,Z,M)}function E(N,O,M){if(M===0)return;Q.get("WEBGL_multi_draw").multiDrawElementsWEBGL(Z,O,0,K,N,0,M);let q=0;for(let D=0;D<M;D++)q+=O[D];$.update(q,Z,1)}function G(N,O,M,k){if(M===0)return;let q=Q.get("WEBGL_multi_draw");if(q===null)for(let D=0;D<N.length;D++)U(N[D]/H,O[D],k[D]);else{q.multiDrawElementsInstancedWEBGL(Z,O,0,K,N,0,k,0,M);let D=0;for(let P=0;P<M;P++)D+=O[P]*k[P];$.update(D,Z,1)}}this.setMode=W,this.setIndex=Y,this.render=X,this.renderInstances=U,this.renderMultiDraw=E,this.renderMultiDrawInstances=G}function XX(J){let Q={geometries:0,textures:0},$={frame:0,calls:0,triangles:0,points:0,lines:0};function Z(K,H,Y){switch($.calls++,H){case J.TRIANGLES:$.triangles+=Y*(K/3);break;case J.LINES:$.lines+=Y*(K/2);break;case J.LINE_STRIP:$.lines+=Y*(K-1);break;case J.LINE_LOOP:$.lines+=Y*K;break;case J.POINTS:$.points+=Y*K;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",H);break}}function W(){$.calls=0,$.triangles=0,$.points=0,$.lines=0}return{memory:Q,render:$,programs:null,autoReset:!0,reset:W,update:Z}}function UX(J,Q,$){let Z=new WeakMap,W=new K0;function K(H,Y,X){let U=H.morphTargetInfluences,E=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,G=E!==void 0?E.length:0,N=Z.get(Y);if(N===void 0||N.count!==G){let z=function(){A.dispose(),Z.delete(Y),Y.removeEventListener("dispose",z)};if(N!==void 0)N.texture.dispose();let O=Y.morphAttributes.position!==void 0,M=Y.morphAttributes.normal!==void 0,k=Y.morphAttributes.color!==void 0,q=Y.morphAttributes.position||[],D=Y.morphAttributes.normal||[],P=Y.morphAttributes.color||[],V=0;if(O===!0)V=1;if(M===!0)V=2;if(k===!0)V=3;let I=Y.attributes.position.count*V,S=1;if(I>Q.maxTextureSize)S=Math.ceil(I/Q.maxTextureSize),I=Q.maxTextureSize;let C=new Float32Array(I*S*4*G),A=new j6(C,I,S,G);A.type=R8,A.needsUpdate=!0;let x=V*4;for(let L=0;L<G;L++){let T=q[L],d=D[L],c=P[L],m=I*S*4*L;for(let o=0;o<T.count;o++){let l=o*x;if(O===!0)W.fromBufferAttribute(T,o),C[m+l+0]=W.x,C[m+l+1]=W.y,C[m+l+2]=W.z,C[m+l+3]=0;if(M===!0)W.fromBufferAttribute(d,o),C[m+l+4]=W.x,C[m+l+5]=W.y,C[m+l+6]=W.z,C[m+l+7]=0;if(k===!0)W.fromBufferAttribute(c,o),C[m+l+8]=W.x,C[m+l+9]=W.y,C[m+l+10]=W.z,C[m+l+11]=c.itemSize===4?W.w:1}}N={count:G,texture:A,size:new cJ(I,S)},Z.set(Y,N),Y.addEventListener("dispose",z)}if(H.isInstancedMesh===!0&&H.morphTexture!==null)X.getUniforms().setValue(J,"morphTexture",H.morphTexture,$);else{let O=0;for(let k=0;k<U.length;k++)O+=U[k];let M=Y.morphTargetsRelative?1:1-O;X.getUniforms().setValue(J,"morphTargetBaseInfluence",M),X.getUniforms().setValue(J,"morphTargetInfluences",U)}X.getUniforms().setValue(J,"morphTargetsTexture",N.texture,$),X.getUniforms().setValue(J,"morphTargetsTextureSize",N.size)}return{update:K}}function GX(J,Q,$,Z){let W=new WeakMap;function K(X){let U=Z.render.frame,E=X.geometry,G=Q.get(X,E);if(W.get(G)!==U)Q.update(G),W.set(G,U);if(X.isInstancedMesh){if(X.hasEventListener("dispose",Y)===!1)X.addEventListener("dispose",Y);if(W.get(X)!==U){if($.update(X.instanceMatrix,J.ARRAY_BUFFER),X.instanceColor!==null)$.update(X.instanceColor,J.ARRAY_BUFFER);W.set(X,U)}}if(X.isSkinnedMesh){let N=X.skeleton;if(W.get(N)!==U)N.update(),W.set(N,U)}return G}function H(){W=new WeakMap}function Y(X){let U=X.target;if(U.removeEventListener("dispose",Y),$.remove(U.instanceMatrix),U.instanceColor!==null)$.remove(U.instanceColor)}return{update:K,dispose:H}}var EW=new z0,sZ=new l6(1,1),NW=new j6,qW=new FQ,DW=new x6,iZ=[],oZ=[],aZ=new Float32Array(16),rZ=new Float32Array(9),tZ=new Float32Array(4);function R9(J,Q,$){let Z=J[0];if(Z<=0||Z>0)return J;let W=Q*$,K=iZ[W];if(K===void 0)K=new Float32Array(W),iZ[W]=K;if(Q!==0){Z.toArray(K,0);for(let H=1,Y=0;H!==Q;++H)Y+=$,J[H].toArray(K,Y)}return K}function U0(J,Q){if(J.length!==Q.length)return!1;for(let $=0,Z=J.length;$<Z;$++)if(J[$]!==Q[$])return!1;return!0}function G0(J,Q){for(let $=0,Z=Q.length;$<Z;$++)J[$]=Q[$]}function o6(J,Q){let $=oZ[Q];if($===void 0)$=new Int32Array(Q),oZ[Q]=$;for(let Z=0;Z!==Q;++Z)$[Z]=J.allocateTextureUnit();return $}function EX(J,Q){let $=this.cache;if($[0]===Q)return;J.uniform1f(this.addr,Q),$[0]=Q}function NX(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y)J.uniform2f(this.addr,Q.x,Q.y),$[0]=Q.x,$[1]=Q.y}else{if(U0($,Q))return;J.uniform2fv(this.addr,Q),G0($,Q)}}function qX(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y||$[2]!==Q.z)J.uniform3f(this.addr,Q.x,Q.y,Q.z),$[0]=Q.x,$[1]=Q.y,$[2]=Q.z}else if(Q.r!==void 0){if($[0]!==Q.r||$[1]!==Q.g||$[2]!==Q.b)J.uniform3f(this.addr,Q.r,Q.g,Q.b),$[0]=Q.r,$[1]=Q.g,$[2]=Q.b}else{if(U0($,Q))return;J.uniform3fv(this.addr,Q),G0($,Q)}}function DX(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y||$[2]!==Q.z||$[3]!==Q.w)J.uniform4f(this.addr,Q.x,Q.y,Q.z,Q.w),$[0]=Q.x,$[1]=Q.y,$[2]=Q.z,$[3]=Q.w}else{if(U0($,Q))return;J.uniform4fv(this.addr,Q),G0($,Q)}}function OX(J,Q){let $=this.cache,Z=Q.elements;if(Z===void 0){if(U0($,Q))return;J.uniformMatrix2fv(this.addr,!1,Q),G0($,Q)}else{if(U0($,Z))return;tZ.set(Z),J.uniformMatrix2fv(this.addr,!1,tZ),G0($,Z)}}function RX(J,Q){let $=this.cache,Z=Q.elements;if(Z===void 0){if(U0($,Q))return;J.uniformMatrix3fv(this.addr,!1,Q),G0($,Q)}else{if(U0($,Z))return;rZ.set(Z),J.uniformMatrix3fv(this.addr,!1,rZ),G0($,Z)}}function FX(J,Q){let $=this.cache,Z=Q.elements;if(Z===void 0){if(U0($,Q))return;J.uniformMatrix4fv(this.addr,!1,Q),G0($,Q)}else{if(U0($,Z))return;aZ.set(Z),J.uniformMatrix4fv(this.addr,!1,aZ),G0($,Z)}}function MX(J,Q){let $=this.cache;if($[0]===Q)return;J.uniform1i(this.addr,Q),$[0]=Q}function kX(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y)J.uniform2i(this.addr,Q.x,Q.y),$[0]=Q.x,$[1]=Q.y}else{if(U0($,Q))return;J.uniform2iv(this.addr,Q),G0($,Q)}}function VX(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y||$[2]!==Q.z)J.uniform3i(this.addr,Q.x,Q.y,Q.z),$[0]=Q.x,$[1]=Q.y,$[2]=Q.z}else{if(U0($,Q))return;J.uniform3iv(this.addr,Q),G0($,Q)}}function LX(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y||$[2]!==Q.z||$[3]!==Q.w)J.uniform4i(this.addr,Q.x,Q.y,Q.z,Q.w),$[0]=Q.x,$[1]=Q.y,$[2]=Q.z,$[3]=Q.w}else{if(U0($,Q))return;J.uniform4iv(this.addr,Q),G0($,Q)}}function zX(J,Q){let $=this.cache;if($[0]===Q)return;J.uniform1ui(this.addr,Q),$[0]=Q}function BX(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y)J.uniform2ui(this.addr,Q.x,Q.y),$[0]=Q.x,$[1]=Q.y}else{if(U0($,Q))return;J.uniform2uiv(this.addr,Q),G0($,Q)}}function IX(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y||$[2]!==Q.z)J.uniform3ui(this.addr,Q.x,Q.y,Q.z),$[0]=Q.x,$[1]=Q.y,$[2]=Q.z}else{if(U0($,Q))return;J.uniform3uiv(this.addr,Q),G0($,Q)}}function _X(J,Q){let $=this.cache;if(Q.x!==void 0){if($[0]!==Q.x||$[1]!==Q.y||$[2]!==Q.z||$[3]!==Q.w)J.uniform4ui(this.addr,Q.x,Q.y,Q.z,Q.w),$[0]=Q.x,$[1]=Q.y,$[2]=Q.z,$[3]=Q.w}else{if(U0($,Q))return;J.uniform4uiv(this.addr,Q),G0($,Q)}}function CX(J,Q,$){let Z=this.cache,W=$.allocateTextureUnit();if(Z[0]!==W)J.uniform1i(this.addr,W),Z[0]=W;let K;if(this.type===J.SAMPLER_2D_SHADOW)sZ.compareFunction=EQ,K=sZ;else K=EW;$.setTexture2D(Q||K,W)}function wX(J,Q,$){let Z=this.cache,W=$.allocateTextureUnit();if(Z[0]!==W)J.uniform1i(this.addr,W),Z[0]=W;$.setTexture3D(Q||qW,W)}function PX(J,Q,$){let Z=this.cache,W=$.allocateTextureUnit();if(Z[0]!==W)J.uniform1i(this.addr,W),Z[0]=W;$.setTextureCube(Q||DW,W)}function AX(J,Q,$){let Z=this.cache,W=$.allocateTextureUnit();if(Z[0]!==W)J.uniform1i(this.addr,W),Z[0]=W;$.setTexture2DArray(Q||NW,W)}function TX(J){switch(J){case 5126:return EX;case 35664:return NX;case 35665:return qX;case 35666:return DX;case 35674:return OX;case 35675:return RX;case 35676:return FX;case 5124:case 35670:return MX;case 35667:case 35671:return kX;case 35668:case 35672:return VX;case 35669:case 35673:return LX;case 5125:return zX;case 36294:return BX;case 36295:return IX;case 36296:return _X;case 35678:case 36198:case 36298:case 36306:case 35682:return CX;case 35679:case 36299:case 36307:return wX;case 35680:case 36300:case 36308:case 36293:return PX;case 36289:case 36303:case 36311:case 36292:return AX}}function SX(J,Q){J.uniform1fv(this.addr,Q)}function jX(J,Q){let $=R9(Q,this.size,2);J.uniform2fv(this.addr,$)}function yX(J,Q){let $=R9(Q,this.size,3);J.uniform3fv(this.addr,$)}function vX(J,Q){let $=R9(Q,this.size,4);J.uniform4fv(this.addr,$)}function fX(J,Q){let $=R9(Q,this.size,4);J.uniformMatrix2fv(this.addr,!1,$)}function bX(J,Q){let $=R9(Q,this.size,9);J.uniformMatrix3fv(this.addr,!1,$)}function hX(J,Q){let $=R9(Q,this.size,16);J.uniformMatrix4fv(this.addr,!1,$)}function xX(J,Q){J.uniform1iv(this.addr,Q)}function gX(J,Q){J.uniform2iv(this.addr,Q)}function pX(J,Q){J.uniform3iv(this.addr,Q)}function mX(J,Q){J.uniform4iv(this.addr,Q)}function dX(J,Q){J.uniform1uiv(this.addr,Q)}function lX(J,Q){J.uniform2uiv(this.addr,Q)}function uX(J,Q){J.uniform3uiv(this.addr,Q)}function cX(J,Q){J.uniform4uiv(this.addr,Q)}function nX(J,Q,$){let Z=this.cache,W=Q.length,K=o6($,W);if(!U0(Z,K))J.uniform1iv(this.addr,K),G0(Z,K);for(let H=0;H!==W;++H)$.setTexture2D(Q[H]||EW,K[H])}function sX(J,Q,$){let Z=this.cache,W=Q.length,K=o6($,W);if(!U0(Z,K))J.uniform1iv(this.addr,K),G0(Z,K);for(let H=0;H!==W;++H)$.setTexture3D(Q[H]||qW,K[H])}function iX(J,Q,$){let Z=this.cache,W=Q.length,K=o6($,W);if(!U0(Z,K))J.uniform1iv(this.addr,K),G0(Z,K);for(let H=0;H!==W;++H)$.setTextureCube(Q[H]||DW,K[H])}function oX(J,Q,$){let Z=this.cache,W=Q.length,K=o6($,W);if(!U0(Z,K))J.uniform1iv(this.addr,K),G0(Z,K);for(let H=0;H!==W;++H)$.setTexture2DArray(Q[H]||NW,K[H])}function aX(J){switch(J){case 5126:return SX;case 35664:return jX;case 35665:return yX;case 35666:return vX;case 35674:return fX;case 35675:return bX;case 35676:return hX;case 5124:case 35670:return xX;case 35667:case 35671:return gX;case 35668:case 35672:return pX;case 35669:case 35673:return mX;case 5125:return dX;case 36294:return lX;case 36295:return uX;case 36296:return cX;case 35678:case 36198:case 36298:case 36306:case 35682:return nX;case 35679:case 36299:case 36307:return sX;case 35680:case 36300:case 36308:case 36293:return iX;case 36289:case 36303:case 36311:case 36292:return oX}}class OW{constructor(J,Q,$){this.id=J,this.addr=$,this.cache=[],this.type=Q.type,this.setValue=TX(Q.type)}}class RW{constructor(J,Q,$){this.id=J,this.addr=$,this.cache=[],this.type=Q.type,this.size=Q.size,this.setValue=aX(Q.type)}}class FW{constructor(J){this.id=J,this.seq=[],this.map={}}setValue(J,Q,$){let Z=this.seq;for(let W=0,K=Z.length;W!==K;++W){let H=Z[W];H.setValue(J,Q[H.id],$)}}}var cQ=/(\w+)(\])?(\[|\.)?/g;function eZ(J,Q){J.seq.push(Q),J.map[Q.id]=Q}function rX(J,Q,$){let Z=J.name,W=Z.length;cQ.lastIndex=0;while(!0){let K=cQ.exec(Z),H=cQ.lastIndex,Y=K[1],X=K[2]==="]",U=K[3];if(X)Y=Y|0;if(U===void 0||U==="["&&H+2===W){eZ($,U===void 0?new OW(Y,J,Q):new RW(Y,J,Q));break}else{let G=$.map[Y];if(G===void 0)G=new FW(Y),eZ($,G);$=G}}}class p9{constructor(J,Q){this.seq=[],this.map={};let $=J.getProgramParameter(Q,J.ACTIVE_UNIFORMS);for(let Z=0;Z<$;++Z){let W=J.getActiveUniform(Q,Z),K=J.getUniformLocation(Q,W.name);rX(W,K,this)}}setValue(J,Q,$,Z){let W=this.map[Q];if(W!==void 0)W.setValue(J,$,Z)}setOptional(J,Q,$){let Z=Q[$];if(Z!==void 0)this.setValue(J,$,Z)}static upload(J,Q,$,Z){for(let W=0,K=Q.length;W!==K;++W){let H=Q[W],Y=$[H.id];if(Y.needsUpdate!==!1)H.setValue(J,Y.value,Z)}}static seqWithValue(J,Q){let $=[];for(let Z=0,W=J.length;Z!==W;++Z){let K=J[Z];if(K.id in Q)$.push(K)}return $}}function JW(J,Q,$){let Z=J.createShader(Q);return J.shaderSource(Z,$),J.compileShader(Z),Z}var tX=37297,eX=0;function JU(J,Q){let $=J.split(`
`),Z=[],W=Math.max(Q-6,0),K=Math.min(Q+6,$.length);for(let H=W;H<K;H++){let Y=H+1;Z.push(`${Y===Q?">":" "} ${Y}: ${$[H]}`)}return Z.join(`
`)}var QW=new vJ;function QU(J){pJ._getMatrix(QW,pJ.workingColorSpace,J);let Q=`mat3( ${QW.elements.map(($)=>$.toFixed(4))} )`;switch(pJ.getTransfer(J)){case GQ:return[Q,"LinearTransferOETF"];case rJ:return[Q,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",J),[Q,"LinearTransferOETF"]}}function $W(J,Q,$){let Z=J.getShaderParameter(Q,J.COMPILE_STATUS),K=(J.getShaderInfoLog(Q)||"").trim();if(Z&&K==="")return"";let H=/ERROR: 0:(\d+)/.exec(K);if(H){let Y=parseInt(H[1]);return $.toUpperCase()+`

`+K+`

`+JU(J.getShaderSource(Q),Y)}else return K}function $U(J,Q){let $=QU(Q);return[`vec4 ${J}( vec4 value ) {`,`	return ${$[1]}( vec4( value.rgb * ${$[0]}, value.a ) );`,"}"].join(`
`)}function ZU(J,Q){let $;switch(Q){case KZ:$="Linear";break;case YZ:$="Reinhard";break;case HZ:$="Cineon";break;case XZ:$="ACESFilmic";break;case GZ:$="AgX";break;case EZ:$="Neutral";break;case UZ:$="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",Q),$="Linear"}return"vec3 "+J+"( vec3 color ) { return "+$+"ToneMapping( color ); }"}var i6=new f;function WU(){pJ.getLuminanceCoefficients(i6);let J=i6.x.toFixed(4),Q=i6.y.toFixed(4),$=i6.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${J}, ${Q}, ${$} );`,"\treturn dot( weights, rgb );","}"].join(`
`)}function KU(J){return[J.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",J.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(g9).join(`
`)}function YU(J){let Q=[];for(let $ in J){let Z=J[$];if(Z===!1)continue;Q.push("#define "+$+" "+Z)}return Q.join(`
`)}function HU(J,Q){let $={},Z=J.getProgramParameter(Q,J.ACTIVE_ATTRIBUTES);for(let W=0;W<Z;W++){let K=J.getActiveAttrib(Q,W),H=K.name,Y=1;if(K.type===J.FLOAT_MAT2)Y=2;if(K.type===J.FLOAT_MAT3)Y=3;if(K.type===J.FLOAT_MAT4)Y=4;$[H]={type:K.type,location:J.getAttribLocation(Q,H),locationSize:Y}}return $}function g9(J){return J!==""}function ZW(J,Q){let $=Q.numSpotLightShadows+Q.numSpotLightMaps-Q.numSpotLightShadowsWithMaps;return J.replace(/NUM_DIR_LIGHTS/g,Q.numDirLights).replace(/NUM_SPOT_LIGHTS/g,Q.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,Q.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,$).replace(/NUM_RECT_AREA_LIGHTS/g,Q.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,Q.numPointLights).replace(/NUM_HEMI_LIGHTS/g,Q.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,Q.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,Q.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,Q.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,Q.numPointLightShadows)}function WW(J,Q){return J.replace(/NUM_CLIPPING_PLANES/g,Q.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,Q.numClippingPlanes-Q.numClipIntersection)}var XU=/^[ \t]*#include +<([\w\d./]+)>/gm;function sQ(J){return J.replace(XU,GU)}var UU=new Map;function GU(J,Q){let $=fJ[Q];if($===void 0){let Z=UU.get(Q);if(Z!==void 0)$=fJ[Z],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',Q,Z);else throw new Error("Can not resolve #include <"+Q+">")}return sQ($)}var EU=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function KW(J){return J.replace(EU,NU)}function NU(J,Q,$,Z){let W="";for(let K=parseInt(Q);K<parseInt($);K++)W+=Z.replace(/\[\s*i\s*\]/g,"[ "+K+" ]").replace(/UNROLLED_LOOP_INDEX/g,K);return W}function YW(J){let Q=`precision ${J.precision} float;
	precision ${J.precision} int;
	precision ${J.precision} sampler2D;
	precision ${J.precision} samplerCube;
	precision ${J.precision} sampler3D;
	precision ${J.precision} sampler2DArray;
	precision ${J.precision} sampler2DShadow;
	precision ${J.precision} samplerCubeShadow;
	precision ${J.precision} sampler2DArrayShadow;
	precision ${J.precision} isampler2D;
	precision ${J.precision} isampler3D;
	precision ${J.precision} isamplerCube;
	precision ${J.precision} isampler2DArray;
	precision ${J.precision} usampler2D;
	precision ${J.precision} usampler3D;
	precision ${J.precision} usamplerCube;
	precision ${J.precision} usampler2DArray;
	`;if(J.precision==="highp")Q+=`
#define HIGH_PRECISION`;else if(J.precision==="mediump")Q+=`
#define MEDIUM_PRECISION`;else if(J.precision==="lowp")Q+=`
#define LOW_PRECISION`;return Q}function qU(J){let Q="SHADOWMAP_TYPE_BASIC";if(J.shadowMapType===w7)Q="SHADOWMAP_TYPE_PCF";else if(J.shadowMapType===f$)Q="SHADOWMAP_TYPE_PCF_SOFT";else if(J.shadowMapType===i0)Q="SHADOWMAP_TYPE_VSM";return Q}function DU(J){let Q="ENVMAP_TYPE_CUBE";if(J.envMap)switch(J.envMapMode){case H9:case P8:Q="ENVMAP_TYPE_CUBE";break;case P9:Q="ENVMAP_TYPE_CUBE_UV";break}return Q}function OU(J){let Q="ENVMAP_MODE_REFLECTION";if(J.envMap)switch(J.envMapMode){case P8:Q="ENVMAP_MODE_REFRACTION";break}return Q}function RU(J){let Q="ENVMAP_BLENDING_NONE";if(J.envMap)switch(J.combine){case $Z:Q="ENVMAP_BLENDING_MULTIPLY";break;case ZZ:Q="ENVMAP_BLENDING_MIX";break;case WZ:Q="ENVMAP_BLENDING_ADD";break}return Q}function FU(J){let Q=J.envMapCubeUVHeight;if(Q===null)return null;let $=Math.log2(Q)-2,Z=1/Q;return{texelWidth:1/(3*Math.max(Math.pow(2,$),112)),texelHeight:Z,maxMip:$}}function MU(J,Q,$,Z){let W=J.getContext(),K=$.defines,H=$.vertexShader,Y=$.fragmentShader,X=qU($),U=DU($),E=OU($),G=RU($),N=FU($),O=KU($),M=YU(K),k=W.createProgram(),q,D,P=$.glslVersion?"#version "+$.glslVersion+`
`:"";if($.isRawShaderMaterial){if(q=["#define SHADER_TYPE "+$.shaderType,"#define SHADER_NAME "+$.shaderName,M].filter(g9).join(`
`),q.length>0)q+=`
`;if(D=["#define SHADER_TYPE "+$.shaderType,"#define SHADER_NAME "+$.shaderName,M].filter(g9).join(`
`),D.length>0)D+=`
`}else q=[YW($),"#define SHADER_TYPE "+$.shaderType,"#define SHADER_NAME "+$.shaderName,M,$.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",$.batching?"#define USE_BATCHING":"",$.batchingColor?"#define USE_BATCHING_COLOR":"",$.instancing?"#define USE_INSTANCING":"",$.instancingColor?"#define USE_INSTANCING_COLOR":"",$.instancingMorph?"#define USE_INSTANCING_MORPH":"",$.useFog&&$.fog?"#define USE_FOG":"",$.useFog&&$.fogExp2?"#define FOG_EXP2":"",$.map?"#define USE_MAP":"",$.envMap?"#define USE_ENVMAP":"",$.envMap?"#define "+E:"",$.lightMap?"#define USE_LIGHTMAP":"",$.aoMap?"#define USE_AOMAP":"",$.bumpMap?"#define USE_BUMPMAP":"",$.normalMap?"#define USE_NORMALMAP":"",$.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",$.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",$.displacementMap?"#define USE_DISPLACEMENTMAP":"",$.emissiveMap?"#define USE_EMISSIVEMAP":"",$.anisotropy?"#define USE_ANISOTROPY":"",$.anisotropyMap?"#define USE_ANISOTROPYMAP":"",$.clearcoatMap?"#define USE_CLEARCOATMAP":"",$.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",$.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",$.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",$.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",$.specularMap?"#define USE_SPECULARMAP":"",$.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",$.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",$.roughnessMap?"#define USE_ROUGHNESSMAP":"",$.metalnessMap?"#define USE_METALNESSMAP":"",$.alphaMap?"#define USE_ALPHAMAP":"",$.alphaHash?"#define USE_ALPHAHASH":"",$.transmission?"#define USE_TRANSMISSION":"",$.transmissionMap?"#define USE_TRANSMISSIONMAP":"",$.thicknessMap?"#define USE_THICKNESSMAP":"",$.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",$.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",$.mapUv?"#define MAP_UV "+$.mapUv:"",$.alphaMapUv?"#define ALPHAMAP_UV "+$.alphaMapUv:"",$.lightMapUv?"#define LIGHTMAP_UV "+$.lightMapUv:"",$.aoMapUv?"#define AOMAP_UV "+$.aoMapUv:"",$.emissiveMapUv?"#define EMISSIVEMAP_UV "+$.emissiveMapUv:"",$.bumpMapUv?"#define BUMPMAP_UV "+$.bumpMapUv:"",$.normalMapUv?"#define NORMALMAP_UV "+$.normalMapUv:"",$.displacementMapUv?"#define DISPLACEMENTMAP_UV "+$.displacementMapUv:"",$.metalnessMapUv?"#define METALNESSMAP_UV "+$.metalnessMapUv:"",$.roughnessMapUv?"#define ROUGHNESSMAP_UV "+$.roughnessMapUv:"",$.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+$.anisotropyMapUv:"",$.clearcoatMapUv?"#define CLEARCOATMAP_UV "+$.clearcoatMapUv:"",$.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+$.clearcoatNormalMapUv:"",$.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+$.clearcoatRoughnessMapUv:"",$.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+$.iridescenceMapUv:"",$.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+$.iridescenceThicknessMapUv:"",$.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+$.sheenColorMapUv:"",$.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+$.sheenRoughnessMapUv:"",$.specularMapUv?"#define SPECULARMAP_UV "+$.specularMapUv:"",$.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+$.specularColorMapUv:"",$.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+$.specularIntensityMapUv:"",$.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+$.transmissionMapUv:"",$.thicknessMapUv?"#define THICKNESSMAP_UV "+$.thicknessMapUv:"",$.vertexTangents&&$.flatShading===!1?"#define USE_TANGENT":"",$.vertexColors?"#define USE_COLOR":"",$.vertexAlphas?"#define USE_COLOR_ALPHA":"",$.vertexUv1s?"#define USE_UV1":"",$.vertexUv2s?"#define USE_UV2":"",$.vertexUv3s?"#define USE_UV3":"",$.pointsUvs?"#define USE_POINTS_UV":"",$.flatShading?"#define FLAT_SHADED":"",$.skinning?"#define USE_SKINNING":"",$.morphTargets?"#define USE_MORPHTARGETS":"",$.morphNormals&&$.flatShading===!1?"#define USE_MORPHNORMALS":"",$.morphColors?"#define USE_MORPHCOLORS":"",$.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+$.morphTextureStride:"",$.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+$.morphTargetsCount:"",$.doubleSided?"#define DOUBLE_SIDED":"",$.flipSided?"#define FLIP_SIDED":"",$.shadowMapEnabled?"#define USE_SHADOWMAP":"",$.shadowMapEnabled?"#define "+X:"",$.sizeAttenuation?"#define USE_SIZEATTENUATION":"",$.numLightProbes>0?"#define USE_LIGHT_PROBES":"",$.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",$.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","\tattribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","\tattribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","\tuniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","\tattribute vec2 uv1;","#endif","#ifdef USE_UV2","\tattribute vec2 uv2;","#endif","#ifdef USE_UV3","\tattribute vec2 uv3;","#endif","#ifdef USE_TANGENT","\tattribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","\tattribute vec4 color;","#elif defined( USE_COLOR )","\tattribute vec3 color;","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif",`
`].filter(g9).join(`
`),D=[YW($),"#define SHADER_TYPE "+$.shaderType,"#define SHADER_NAME "+$.shaderName,M,$.useFog&&$.fog?"#define USE_FOG":"",$.useFog&&$.fogExp2?"#define FOG_EXP2":"",$.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",$.map?"#define USE_MAP":"",$.matcap?"#define USE_MATCAP":"",$.envMap?"#define USE_ENVMAP":"",$.envMap?"#define "+U:"",$.envMap?"#define "+E:"",$.envMap?"#define "+G:"",N?"#define CUBEUV_TEXEL_WIDTH "+N.texelWidth:"",N?"#define CUBEUV_TEXEL_HEIGHT "+N.texelHeight:"",N?"#define CUBEUV_MAX_MIP "+N.maxMip+".0":"",$.lightMap?"#define USE_LIGHTMAP":"",$.aoMap?"#define USE_AOMAP":"",$.bumpMap?"#define USE_BUMPMAP":"",$.normalMap?"#define USE_NORMALMAP":"",$.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",$.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",$.emissiveMap?"#define USE_EMISSIVEMAP":"",$.anisotropy?"#define USE_ANISOTROPY":"",$.anisotropyMap?"#define USE_ANISOTROPYMAP":"",$.clearcoat?"#define USE_CLEARCOAT":"",$.clearcoatMap?"#define USE_CLEARCOATMAP":"",$.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",$.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",$.dispersion?"#define USE_DISPERSION":"",$.iridescence?"#define USE_IRIDESCENCE":"",$.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",$.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",$.specularMap?"#define USE_SPECULARMAP":"",$.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",$.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",$.roughnessMap?"#define USE_ROUGHNESSMAP":"",$.metalnessMap?"#define USE_METALNESSMAP":"",$.alphaMap?"#define USE_ALPHAMAP":"",$.alphaTest?"#define USE_ALPHATEST":"",$.alphaHash?"#define USE_ALPHAHASH":"",$.sheen?"#define USE_SHEEN":"",$.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",$.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",$.transmission?"#define USE_TRANSMISSION":"",$.transmissionMap?"#define USE_TRANSMISSIONMAP":"",$.thicknessMap?"#define USE_THICKNESSMAP":"",$.vertexTangents&&$.flatShading===!1?"#define USE_TANGENT":"",$.vertexColors||$.instancingColor||$.batchingColor?"#define USE_COLOR":"",$.vertexAlphas?"#define USE_COLOR_ALPHA":"",$.vertexUv1s?"#define USE_UV1":"",$.vertexUv2s?"#define USE_UV2":"",$.vertexUv3s?"#define USE_UV3":"",$.pointsUvs?"#define USE_POINTS_UV":"",$.gradientMap?"#define USE_GRADIENTMAP":"",$.flatShading?"#define FLAT_SHADED":"",$.doubleSided?"#define DOUBLE_SIDED":"",$.flipSided?"#define FLIP_SIDED":"",$.shadowMapEnabled?"#define USE_SHADOWMAP":"",$.shadowMapEnabled?"#define "+X:"",$.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",$.numLightProbes>0?"#define USE_LIGHT_PROBES":"",$.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",$.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",$.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",$.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",$.toneMapping!==K8?"#define TONE_MAPPING":"",$.toneMapping!==K8?fJ.tonemapping_pars_fragment:"",$.toneMapping!==K8?ZU("toneMapping",$.toneMapping):"",$.dithering?"#define DITHERING":"",$.opaque?"#define OPAQUE":"",fJ.colorspace_pars_fragment,$U("linearToOutputTexel",$.outputColorSpace),WU(),$.useDepthPacking?"#define DEPTH_PACKING "+$.depthPacking:"",`
`].filter(g9).join(`
`);if(H=sQ(H),H=ZW(H,$),H=WW(H,$),Y=sQ(Y),Y=ZW(Y,$),Y=WW(Y,$),H=KW(H),Y=KW(Y),$.isRawShaderMaterial!==!0)P=`#version 300 es
`,q=[O,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+q,D=["#define varying in",$.glslVersion===NQ?"":"layout(location = 0) out highp vec4 pc_fragColor;",$.glslVersion===NQ?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+D;let V=P+q+H,I=P+D+Y,S=JW(W,W.VERTEX_SHADER,V),C=JW(W,W.FRAGMENT_SHADER,I);if(W.attachShader(k,S),W.attachShader(k,C),$.index0AttributeName!==void 0)W.bindAttribLocation(k,0,$.index0AttributeName);else if($.morphTargets===!0)W.bindAttribLocation(k,0,"position");W.linkProgram(k);function A(T){if(J.debug.checkShaderErrors){let d=W.getProgramInfoLog(k)||"",c=W.getShaderInfoLog(S)||"",m=W.getShaderInfoLog(C)||"",o=d.trim(),l=c.trim(),r=m.trim(),g=!0,KJ=!0;if(W.getProgramParameter(k,W.LINK_STATUS)===!1)if(g=!1,typeof J.debug.onShaderError==="function")J.debug.onShaderError(W,k,S,C);else{let GJ=$W(W,S,"vertex"),PJ=$W(W,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+W.getError()+" - VALIDATE_STATUS "+W.getProgramParameter(k,W.VALIDATE_STATUS)+`

Material Name: `+T.name+`
Material Type: `+T.type+`

Program Info Log: `+o+`
`+GJ+`
`+PJ)}else if(o!=="")console.warn("THREE.WebGLProgram: Program Info Log:",o);else if(l===""||r==="")KJ=!1;if(KJ)T.diagnostics={runnable:g,programLog:o,vertexShader:{log:l,prefix:q},fragmentShader:{log:r,prefix:D}}}W.deleteShader(S),W.deleteShader(C),x=new p9(W,k),z=HU(W,k)}let x;this.getUniforms=function(){if(x===void 0)A(this);return x};let z;this.getAttributes=function(){if(z===void 0)A(this);return z};let L=$.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){if(L===!1)L=W.getProgramParameter(k,tX);return L},this.destroy=function(){Z.releaseStatesOfProgram(this),W.deleteProgram(k),this.program=void 0},this.type=$.shaderType,this.name=$.shaderName,this.id=eX++,this.cacheKey=Q,this.usedTimes=1,this.program=k,this.vertexShader=S,this.fragmentShader=C,this}var kU=0;class MW{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(J){let{vertexShader:Q,fragmentShader:$}=J,Z=this._getShaderStage(Q),W=this._getShaderStage($),K=this._getShaderCacheForMaterial(J);if(K.has(Z)===!1)K.add(Z),Z.usedTimes++;if(K.has(W)===!1)K.add(W),W.usedTimes++;return this}remove(J){let Q=this.materialCache.get(J);for(let $ of Q)if($.usedTimes--,$.usedTimes===0)this.shaderCache.delete($.code);return this.materialCache.delete(J),this}getVertexShaderID(J){return this._getShaderStage(J.vertexShader).id}getFragmentShaderID(J){return this._getShaderStage(J.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(J){let Q=this.materialCache,$=Q.get(J);if($===void 0)$=new Set,Q.set(J,$);return $}_getShaderStage(J){let Q=this.shaderCache,$=Q.get(J);if($===void 0)$=new kW(J),Q.set(J,$);return $}}class kW{constructor(J){this.id=kU++,this.code=J,this.usedTimes=0}}function VU(J,Q,$,Z,W,K,H){let Y=new y6,X=new MW,U=new Set,E=[],G=W.logarithmicDepthBuffer,N=W.vertexTextures,O=W.precision,M={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function k(z){if(U.add(z),z===0)return"uv";return`uv${z}`}function q(z,L,T,d,c){let m=d.fog,o=c.geometry,l=z.isMeshStandardMaterial?d.environment:null,r=(z.isMeshStandardMaterial?$:Q).get(z.envMap||l),g=!!r&&r.mapping===P9?r.image.height:null,KJ=M[z.type];if(z.precision!==null){if(O=W.getMaxPrecision(z.precision),O!==z.precision)console.warn("THREE.WebGLProgram.getParameters:",z.precision,"not supported, using",O,"instead.")}let GJ=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,PJ=GJ!==void 0?GJ.length:0,xJ=0;if(o.morphAttributes.position!==void 0)xJ=1;if(o.morphAttributes.normal!==void 0)xJ=2;if(o.morphAttributes.color!==void 0)xJ=3;let Y0,mJ,n,WJ;if(KJ){let nJ=r0[KJ];Y0=nJ.vertexShader,mJ=nJ.fragmentShader}else Y0=z.vertexShader,mJ=z.fragmentShader,X.update(z),n=X.getVertexShaderID(z),WJ=X.getFragmentShaderID(z);let QJ=J.getRenderTarget(),MJ=J.state.buffers.depth.getReversed(),TJ=c.isInstancedMesh===!0,SJ=c.isBatchedMesh===!0,E0=!!z.map,_=!!z.matcap,eJ=!!r,yJ=!!z.aoMap,AJ=!!z.lightMap,RJ=!!z.bumpMap,J0=!!z.normalMap,LJ=!!z.displacementMap,IJ=!!z.emissiveMap,O0=!!z.metalnessMap,N0=!!z.roughnessMap,H0=z.anisotropy>0,B=z.clearcoat>0,R=z.dispersion>0,v=z.iridescence>0,u=z.sheen>0,i=z.transmission>0,p=H0&&!!z.anisotropyMap,NJ=B&&!!z.clearcoatMap,JJ=B&&!!z.clearcoatNormalMap,FJ=B&&!!z.clearcoatRoughnessMap,CJ=v&&!!z.iridescenceMap,e=v&&!!z.iridescenceThicknessMap,XJ=u&&!!z.sheenColorMap,kJ=u&&!!z.sheenRoughnessMap,VJ=!!z.specularMap,UJ=!!z.specularColorMap,bJ=!!z.specularIntensityMap,w=i&&!!z.transmissionMap,YJ=i&&!!z.thicknessMap,$J=!!z.gradientMap,qJ=!!z.alphaMap,a=z.alphaTest>0,s=!!z.alphaHash,OJ=!!z.extensions,jJ=K8;if(z.toneMapped){if(QJ===null||QJ.isXRRenderTarget===!0)jJ=J.toneMapping}let iJ={shaderID:KJ,shaderType:z.type,shaderName:z.name,vertexShader:Y0,fragmentShader:mJ,defines:z.defines,customVertexShaderID:n,customFragmentShaderID:WJ,isRawShaderMaterial:z.isRawShaderMaterial===!0,glslVersion:z.glslVersion,precision:O,batching:SJ,batchingColor:SJ&&c._colorsTexture!==null,instancing:TJ,instancingColor:TJ&&c.instanceColor!==null,instancingMorph:TJ&&c.morphTexture!==null,supportsVertexTextures:N,outputColorSpace:QJ===null?J.outputColorSpace:QJ.isXRRenderTarget===!0?QJ.texture.colorSpace:y9,alphaToCoverage:!!z.alphaToCoverage,map:E0,matcap:_,envMap:eJ,envMapMode:eJ&&r.mapping,envMapCubeUVHeight:g,aoMap:yJ,lightMap:AJ,bumpMap:RJ,normalMap:J0,displacementMap:N&&LJ,emissiveMap:IJ,normalMapObjectSpace:J0&&z.normalMapType===CZ,normalMapTangentSpace:J0&&z.normalMapType===_Z,metalnessMap:O0,roughnessMap:N0,anisotropy:H0,anisotropyMap:p,clearcoat:B,clearcoatMap:NJ,clearcoatNormalMap:JJ,clearcoatRoughnessMap:FJ,dispersion:R,iridescence:v,iridescenceMap:CJ,iridescenceThicknessMap:e,sheen:u,sheenColorMap:XJ,sheenRoughnessMap:kJ,specularMap:VJ,specularColorMap:UJ,specularIntensityMap:bJ,transmission:i,transmissionMap:w,thicknessMap:YJ,gradientMap:$J,opaque:z.transparent===!1&&z.blending===C9&&z.alphaToCoverage===!1,alphaMap:qJ,alphaTest:a,alphaHash:s,combine:z.combine,mapUv:E0&&k(z.map.channel),aoMapUv:yJ&&k(z.aoMap.channel),lightMapUv:AJ&&k(z.lightMap.channel),bumpMapUv:RJ&&k(z.bumpMap.channel),normalMapUv:J0&&k(z.normalMap.channel),displacementMapUv:LJ&&k(z.displacementMap.channel),emissiveMapUv:IJ&&k(z.emissiveMap.channel),metalnessMapUv:O0&&k(z.metalnessMap.channel),roughnessMapUv:N0&&k(z.roughnessMap.channel),anisotropyMapUv:p&&k(z.anisotropyMap.channel),clearcoatMapUv:NJ&&k(z.clearcoatMap.channel),clearcoatNormalMapUv:JJ&&k(z.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:FJ&&k(z.clearcoatRoughnessMap.channel),iridescenceMapUv:CJ&&k(z.iridescenceMap.channel),iridescenceThicknessMapUv:e&&k(z.iridescenceThicknessMap.channel),sheenColorMapUv:XJ&&k(z.sheenColorMap.channel),sheenRoughnessMapUv:kJ&&k(z.sheenRoughnessMap.channel),specularMapUv:VJ&&k(z.specularMap.channel),specularColorMapUv:UJ&&k(z.specularColorMap.channel),specularIntensityMapUv:bJ&&k(z.specularIntensityMap.channel),transmissionMapUv:w&&k(z.transmissionMap.channel),thicknessMapUv:YJ&&k(z.thicknessMap.channel),alphaMapUv:qJ&&k(z.alphaMap.channel),vertexTangents:!!o.attributes.tangent&&(J0||H0),vertexColors:z.vertexColors,vertexAlphas:z.vertexColors===!0&&!!o.attributes.color&&o.attributes.color.itemSize===4,pointsUvs:c.isPoints===!0&&!!o.attributes.uv&&(E0||qJ),fog:!!m,useFog:z.fog===!0,fogExp2:!!m&&m.isFogExp2,flatShading:z.flatShading===!0&&z.wireframe===!1,sizeAttenuation:z.sizeAttenuation===!0,logarithmicDepthBuffer:G,reversedDepthBuffer:MJ,skinning:c.isSkinnedMesh===!0,morphTargets:o.morphAttributes.position!==void 0,morphNormals:o.morphAttributes.normal!==void 0,morphColors:o.morphAttributes.color!==void 0,morphTargetsCount:PJ,morphTextureStride:xJ,numDirLights:L.directional.length,numPointLights:L.point.length,numSpotLights:L.spot.length,numSpotLightMaps:L.spotLightMap.length,numRectAreaLights:L.rectArea.length,numHemiLights:L.hemi.length,numDirLightShadows:L.directionalShadowMap.length,numPointLightShadows:L.pointShadowMap.length,numSpotLightShadows:L.spotShadowMap.length,numSpotLightShadowsWithMaps:L.numSpotLightShadowsWithMaps,numLightProbes:L.numLightProbes,numClippingPlanes:H.numPlanes,numClipIntersection:H.numIntersection,dithering:z.dithering,shadowMapEnabled:J.shadowMap.enabled&&T.length>0,shadowMapType:J.shadowMap.type,toneMapping:jJ,decodeVideoTexture:E0&&z.map.isVideoTexture===!0&&pJ.getTransfer(z.map.colorSpace)===rJ,decodeVideoTextureEmissive:IJ&&z.emissiveMap.isVideoTexture===!0&&pJ.getTransfer(z.emissiveMap.colorSpace)===rJ,premultipliedAlpha:z.premultipliedAlpha,doubleSided:z.side===o0,flipSided:z.side===T0,useDepthPacking:z.depthPacking>=0,depthPacking:z.depthPacking||0,index0AttributeName:z.index0AttributeName,extensionClipCullDistance:OJ&&z.extensions.clipCullDistance===!0&&Z.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(OJ&&z.extensions.multiDraw===!0||SJ)&&Z.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:Z.has("KHR_parallel_shader_compile"),customProgramCacheKey:z.customProgramCacheKey()};return iJ.vertexUv1s=U.has(1),iJ.vertexUv2s=U.has(2),iJ.vertexUv3s=U.has(3),U.clear(),iJ}function D(z){let L=[];if(z.shaderID)L.push(z.shaderID);else L.push(z.customVertexShaderID),L.push(z.customFragmentShaderID);if(z.defines!==void 0)for(let T in z.defines)L.push(T),L.push(z.defines[T]);if(z.isRawShaderMaterial===!1)P(L,z),V(L,z),L.push(J.outputColorSpace);return L.push(z.customProgramCacheKey),L.join()}function P(z,L){z.push(L.precision),z.push(L.outputColorSpace),z.push(L.envMapMode),z.push(L.envMapCubeUVHeight),z.push(L.mapUv),z.push(L.alphaMapUv),z.push(L.lightMapUv),z.push(L.aoMapUv),z.push(L.bumpMapUv),z.push(L.normalMapUv),z.push(L.displacementMapUv),z.push(L.emissiveMapUv),z.push(L.metalnessMapUv),z.push(L.roughnessMapUv),z.push(L.anisotropyMapUv),z.push(L.clearcoatMapUv),z.push(L.clearcoatNormalMapUv),z.push(L.clearcoatRoughnessMapUv),z.push(L.iridescenceMapUv),z.push(L.iridescenceThicknessMapUv),z.push(L.sheenColorMapUv),z.push(L.sheenRoughnessMapUv),z.push(L.specularMapUv),z.push(L.specularColorMapUv),z.push(L.specularIntensityMapUv),z.push(L.transmissionMapUv),z.push(L.thicknessMapUv),z.push(L.combine),z.push(L.fogExp2),z.push(L.sizeAttenuation),z.push(L.morphTargetsCount),z.push(L.morphAttributeCount),z.push(L.numDirLights),z.push(L.numPointLights),z.push(L.numSpotLights),z.push(L.numSpotLightMaps),z.push(L.numHemiLights),z.push(L.numRectAreaLights),z.push(L.numDirLightShadows),z.push(L.numPointLightShadows),z.push(L.numSpotLightShadows),z.push(L.numSpotLightShadowsWithMaps),z.push(L.numLightProbes),z.push(L.shadowMapType),z.push(L.toneMapping),z.push(L.numClippingPlanes),z.push(L.numClipIntersection),z.push(L.depthPacking)}function V(z,L){if(Y.disableAll(),L.supportsVertexTextures)Y.enable(0);if(L.instancing)Y.enable(1);if(L.instancingColor)Y.enable(2);if(L.instancingMorph)Y.enable(3);if(L.matcap)Y.enable(4);if(L.envMap)Y.enable(5);if(L.normalMapObjectSpace)Y.enable(6);if(L.normalMapTangentSpace)Y.enable(7);if(L.clearcoat)Y.enable(8);if(L.iridescence)Y.enable(9);if(L.alphaTest)Y.enable(10);if(L.vertexColors)Y.enable(11);if(L.vertexAlphas)Y.enable(12);if(L.vertexUv1s)Y.enable(13);if(L.vertexUv2s)Y.enable(14);if(L.vertexUv3s)Y.enable(15);if(L.vertexTangents)Y.enable(16);if(L.anisotropy)Y.enable(17);if(L.alphaHash)Y.enable(18);if(L.batching)Y.enable(19);if(L.dispersion)Y.enable(20);if(L.batchingColor)Y.enable(21);if(L.gradientMap)Y.enable(22);if(z.push(Y.mask),Y.disableAll(),L.fog)Y.enable(0);if(L.useFog)Y.enable(1);if(L.flatShading)Y.enable(2);if(L.logarithmicDepthBuffer)Y.enable(3);if(L.reversedDepthBuffer)Y.enable(4);if(L.skinning)Y.enable(5);if(L.morphTargets)Y.enable(6);if(L.morphNormals)Y.enable(7);if(L.morphColors)Y.enable(8);if(L.premultipliedAlpha)Y.enable(9);if(L.shadowMapEnabled)Y.enable(10);if(L.doubleSided)Y.enable(11);if(L.flipSided)Y.enable(12);if(L.useDepthPacking)Y.enable(13);if(L.dithering)Y.enable(14);if(L.transmission)Y.enable(15);if(L.sheen)Y.enable(16);if(L.opaque)Y.enable(17);if(L.pointsUvs)Y.enable(18);if(L.decodeVideoTexture)Y.enable(19);if(L.decodeVideoTextureEmissive)Y.enable(20);if(L.alphaToCoverage)Y.enable(21);z.push(Y.mask)}function I(z){let L=M[z.type],T;if(L){let d=r0[L];T=xZ.clone(d.uniforms)}else T=z.uniforms;return T}function S(z,L){let T;for(let d=0,c=E.length;d<c;d++){let m=E[d];if(m.cacheKey===L){T=m,++T.usedTimes;break}}if(T===void 0)T=new MU(J,L,z,K),E.push(T);return T}function C(z){if(--z.usedTimes===0){let L=E.indexOf(z);E[L]=E[E.length-1],E.pop(),z.destroy()}}function A(z){X.remove(z)}function x(){X.dispose()}return{getParameters:q,getProgramCacheKey:D,getUniforms:I,acquireProgram:S,releaseProgram:C,releaseShaderCache:A,programs:E,dispose:x}}function LU(){let J=new WeakMap;function Q(H){return J.has(H)}function $(H){let Y=J.get(H);if(Y===void 0)Y={},J.set(H,Y);return Y}function Z(H){J.delete(H)}function W(H,Y,X){J.get(H)[Y]=X}function K(){J=new WeakMap}return{has:Q,get:$,remove:Z,update:W,dispose:K}}function zU(J,Q){if(J.groupOrder!==Q.groupOrder)return J.groupOrder-Q.groupOrder;else if(J.renderOrder!==Q.renderOrder)return J.renderOrder-Q.renderOrder;else if(J.material.id!==Q.material.id)return J.material.id-Q.material.id;else if(J.z!==Q.z)return J.z-Q.z;else return J.id-Q.id}function HW(J,Q){if(J.groupOrder!==Q.groupOrder)return J.groupOrder-Q.groupOrder;else if(J.renderOrder!==Q.renderOrder)return J.renderOrder-Q.renderOrder;else if(J.z!==Q.z)return Q.z-J.z;else return J.id-Q.id}function XW(){let J=[],Q=0,$=[],Z=[],W=[];function K(){Q=0,$.length=0,Z.length=0,W.length=0}function H(G,N,O,M,k,q){let D=J[Q];if(D===void 0)D={id:G.id,object:G,geometry:N,material:O,groupOrder:M,renderOrder:G.renderOrder,z:k,group:q},J[Q]=D;else D.id=G.id,D.object=G,D.geometry=N,D.material=O,D.groupOrder=M,D.renderOrder=G.renderOrder,D.z=k,D.group=q;return Q++,D}function Y(G,N,O,M,k,q){let D=H(G,N,O,M,k,q);if(O.transmission>0)Z.push(D);else if(O.transparent===!0)W.push(D);else $.push(D)}function X(G,N,O,M,k,q){let D=H(G,N,O,M,k,q);if(O.transmission>0)Z.unshift(D);else if(O.transparent===!0)W.unshift(D);else $.unshift(D)}function U(G,N){if($.length>1)$.sort(G||zU);if(Z.length>1)Z.sort(N||HW);if(W.length>1)W.sort(N||HW)}function E(){for(let G=Q,N=J.length;G<N;G++){let O=J[G];if(O.id===null)break;O.id=null,O.object=null,O.geometry=null,O.material=null,O.group=null}}return{opaque:$,transmissive:Z,transparent:W,init:K,push:Y,unshift:X,finish:E,sort:U}}function BU(){let J=new WeakMap;function Q(Z,W){let K=J.get(Z),H;if(K===void 0)H=new XW,J.set(Z,[H]);else if(W>=K.length)H=new XW,K.push(H);else H=K[W];return H}function $(){J=new WeakMap}return{get:Q,dispose:$}}function IU(){let J={};return{get:function(Q){if(J[Q.id]!==void 0)return J[Q.id];let $;switch(Q.type){case"DirectionalLight":$={direction:new f,color:new lJ};break;case"SpotLight":$={position:new f,direction:new f,color:new lJ,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":$={position:new f,color:new lJ,distance:0,decay:0};break;case"HemisphereLight":$={direction:new f,skyColor:new lJ,groundColor:new lJ};break;case"RectAreaLight":$={color:new lJ,position:new f,halfWidth:new f,halfHeight:new f};break}return J[Q.id]=$,$}}}function _U(){let J={};return{get:function(Q){if(J[Q.id]!==void 0)return J[Q.id];let $;switch(Q.type){case"DirectionalLight":$={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new cJ};break;case"SpotLight":$={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new cJ};break;case"PointLight":$={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new cJ,shadowCameraNear:1,shadowCameraFar:1000};break}return J[Q.id]=$,$}}}var CU=0;function wU(J,Q){return(Q.castShadow?2:0)-(J.castShadow?2:0)+(Q.map?1:0)-(J.map?1:0)}function PU(J){let Q=new IU,$=_U(),Z={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let U=0;U<9;U++)Z.probe.push(new f);let W=new f,K=new W0,H=new W0;function Y(U){let E=0,G=0,N=0;for(let z=0;z<9;z++)Z.probe[z].set(0,0,0);let O=0,M=0,k=0,q=0,D=0,P=0,V=0,I=0,S=0,C=0,A=0;U.sort(wU);for(let z=0,L=U.length;z<L;z++){let T=U[z],d=T.color,c=T.intensity,m=T.distance,o=T.shadow&&T.shadow.map?T.shadow.map.texture:null;if(T.isAmbientLight)E+=d.r*c,G+=d.g*c,N+=d.b*c;else if(T.isLightProbe){for(let l=0;l<9;l++)Z.probe[l].addScaledVector(T.sh.coefficients[l],c);A++}else if(T.isDirectionalLight){let l=Q.get(T);if(l.color.copy(T.color).multiplyScalar(T.intensity),T.castShadow){let r=T.shadow,g=$.get(T);g.shadowIntensity=r.intensity,g.shadowBias=r.bias,g.shadowNormalBias=r.normalBias,g.shadowRadius=r.radius,g.shadowMapSize=r.mapSize,Z.directionalShadow[O]=g,Z.directionalShadowMap[O]=o,Z.directionalShadowMatrix[O]=T.shadow.matrix,P++}Z.directional[O]=l,O++}else if(T.isSpotLight){let l=Q.get(T);l.position.setFromMatrixPosition(T.matrixWorld),l.color.copy(d).multiplyScalar(c),l.distance=m,l.coneCos=Math.cos(T.angle),l.penumbraCos=Math.cos(T.angle*(1-T.penumbra)),l.decay=T.decay,Z.spot[k]=l;let r=T.shadow;if(T.map){if(Z.spotLightMap[S]=T.map,S++,r.updateMatrices(T),T.castShadow)C++}if(Z.spotLightMatrix[k]=r.matrix,T.castShadow){let g=$.get(T);g.shadowIntensity=r.intensity,g.shadowBias=r.bias,g.shadowNormalBias=r.normalBias,g.shadowRadius=r.radius,g.shadowMapSize=r.mapSize,Z.spotShadow[k]=g,Z.spotShadowMap[k]=o,I++}k++}else if(T.isRectAreaLight){let l=Q.get(T);l.color.copy(d).multiplyScalar(c),l.halfWidth.set(T.width*0.5,0,0),l.halfHeight.set(0,T.height*0.5,0),Z.rectArea[q]=l,q++}else if(T.isPointLight){let l=Q.get(T);if(l.color.copy(T.color).multiplyScalar(T.intensity),l.distance=T.distance,l.decay=T.decay,T.castShadow){let r=T.shadow,g=$.get(T);g.shadowIntensity=r.intensity,g.shadowBias=r.bias,g.shadowNormalBias=r.normalBias,g.shadowRadius=r.radius,g.shadowMapSize=r.mapSize,g.shadowCameraNear=r.camera.near,g.shadowCameraFar=r.camera.far,Z.pointShadow[M]=g,Z.pointShadowMap[M]=o,Z.pointShadowMatrix[M]=T.shadow.matrix,V++}Z.point[M]=l,M++}else if(T.isHemisphereLight){let l=Q.get(T);l.skyColor.copy(T.color).multiplyScalar(c),l.groundColor.copy(T.groundColor).multiplyScalar(c),Z.hemi[D]=l,D++}}if(q>0)if(J.has("OES_texture_float_linear")===!0)Z.rectAreaLTC1=ZJ.LTC_FLOAT_1,Z.rectAreaLTC2=ZJ.LTC_FLOAT_2;else Z.rectAreaLTC1=ZJ.LTC_HALF_1,Z.rectAreaLTC2=ZJ.LTC_HALF_2;Z.ambient[0]=E,Z.ambient[1]=G,Z.ambient[2]=N;let x=Z.hash;if(x.directionalLength!==O||x.pointLength!==M||x.spotLength!==k||x.rectAreaLength!==q||x.hemiLength!==D||x.numDirectionalShadows!==P||x.numPointShadows!==V||x.numSpotShadows!==I||x.numSpotMaps!==S||x.numLightProbes!==A)Z.directional.length=O,Z.spot.length=k,Z.rectArea.length=q,Z.point.length=M,Z.hemi.length=D,Z.directionalShadow.length=P,Z.directionalShadowMap.length=P,Z.pointShadow.length=V,Z.pointShadowMap.length=V,Z.spotShadow.length=I,Z.spotShadowMap.length=I,Z.directionalShadowMatrix.length=P,Z.pointShadowMatrix.length=V,Z.spotLightMatrix.length=I+S-C,Z.spotLightMap.length=S,Z.numSpotLightShadowsWithMaps=C,Z.numLightProbes=A,x.directionalLength=O,x.pointLength=M,x.spotLength=k,x.rectAreaLength=q,x.hemiLength=D,x.numDirectionalShadows=P,x.numPointShadows=V,x.numSpotShadows=I,x.numSpotMaps=S,x.numLightProbes=A,Z.version=CU++}function X(U,E){let G=0,N=0,O=0,M=0,k=0,q=E.matrixWorldInverse;for(let D=0,P=U.length;D<P;D++){let V=U[D];if(V.isDirectionalLight){let I=Z.directional[G];I.direction.setFromMatrixPosition(V.matrixWorld),W.setFromMatrixPosition(V.target.matrixWorld),I.direction.sub(W),I.direction.transformDirection(q),G++}else if(V.isSpotLight){let I=Z.spot[O];I.position.setFromMatrixPosition(V.matrixWorld),I.position.applyMatrix4(q),I.direction.setFromMatrixPosition(V.matrixWorld),W.setFromMatrixPosition(V.target.matrixWorld),I.direction.sub(W),I.direction.transformDirection(q),O++}else if(V.isRectAreaLight){let I=Z.rectArea[M];I.position.setFromMatrixPosition(V.matrixWorld),I.position.applyMatrix4(q),H.identity(),K.copy(V.matrixWorld),K.premultiply(q),H.extractRotation(K),I.halfWidth.set(V.width*0.5,0,0),I.halfHeight.set(0,V.height*0.5,0),I.halfWidth.applyMatrix4(H),I.halfHeight.applyMatrix4(H),M++}else if(V.isPointLight){let I=Z.point[N];I.position.setFromMatrixPosition(V.matrixWorld),I.position.applyMatrix4(q),N++}else if(V.isHemisphereLight){let I=Z.hemi[k];I.direction.setFromMatrixPosition(V.matrixWorld),I.direction.transformDirection(q),k++}}}return{setup:Y,setupView:X,state:Z}}function UW(J){let Q=new PU(J),$=[],Z=[];function W(E){U.camera=E,$.length=0,Z.length=0}function K(E){$.push(E)}function H(E){Z.push(E)}function Y(){Q.setup($)}function X(E){Q.setupView($,E)}let U={lightsArray:$,shadowsArray:Z,camera:null,lights:Q,transmissionRenderTarget:{}};return{init:W,state:U,setupLights:Y,setupLightsView:X,pushLight:K,pushShadow:H}}function AU(J){let Q=new WeakMap;function $(W,K=0){let H=Q.get(W),Y;if(H===void 0)Y=new UW(J),Q.set(W,[Y]);else if(K>=H.length)Y=new UW(J),H.push(Y);else Y=H[K];return Y}function Z(){Q=new WeakMap}return{get:$,dispose:Z}}var TU=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,SU=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function jU(J,Q,$){let Z=new p6,W=new cJ,K=new cJ,H=new K0,Y=new IQ({depthPacking:IZ}),X=new _Q,U={},E=$.maxTextureSize,G={[W9]:T0,[T0]:W9,[o0]:o0},N=new j0({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new cJ},radius:{value:4}},vertexShader:TU,fragmentShader:SU}),O=N.clone();O.defines.HORIZONTAL_PASS=1;let M=new S0;M.setAttribute("position",new aJ(new Float32Array([-1,-1,0.5,3,-1,0.5,-1,3,0.5]),3));let k=new l0(M,N),q=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=w7;let D=this.type;this.render=function(C,A,x){if(q.enabled===!1)return;if(q.autoUpdate===!1&&q.needsUpdate===!1)return;if(C.length===0)return;let z=J.getRenderTarget(),L=J.getActiveCubeFace(),T=J.getActiveMipmapLevel(),d=J.state;if(d.setBlending(D8),d.buffers.depth.getReversed()===!0)d.buffers.color.setClear(0,0,0,0);else d.buffers.color.setClear(1,1,1,1);d.buffers.depth.setTest(!0),d.setScissorTest(!1);let c=D!==i0&&this.type===i0,m=D===i0&&this.type!==i0;for(let o=0,l=C.length;o<l;o++){let r=C[o],g=r.shadow;if(g===void 0){console.warn("THREE.WebGLShadowMap:",r,"has no shadow.");continue}if(g.autoUpdate===!1&&g.needsUpdate===!1)continue;W.copy(g.mapSize);let KJ=g.getFrameExtents();if(W.multiply(KJ),K.copy(g.mapSize),W.x>E||W.y>E){if(W.x>E)K.x=Math.floor(E/KJ.x),W.x=K.x*KJ.x,g.mapSize.x=K.x;if(W.y>E)K.y=Math.floor(E/KJ.y),W.y=K.y*KJ.y,g.mapSize.y=K.y}if(g.map===null||c===!0||m===!0){let PJ=this.type!==i0?{minFilter:X9,magFilter:X9}:{};if(g.map!==null)g.map.dispose();g.map=new Y8(W.x,W.y,PJ),g.map.texture.name=r.name+".shadowMap",g.camera.updateProjectionMatrix()}J.setRenderTarget(g.map),J.clear();let GJ=g.getViewportCount();for(let PJ=0;PJ<GJ;PJ++){let xJ=g.getViewport(PJ);H.set(K.x*xJ.x,K.y*xJ.y,K.x*xJ.z,K.y*xJ.w),d.viewport(H),g.updateMatrices(r,PJ),Z=g.getFrustum(),I(A,x,g.camera,r,this.type)}if(g.isPointLightShadow!==!0&&this.type===i0)P(g,x);g.needsUpdate=!1}D=this.type,q.needsUpdate=!1,J.setRenderTarget(z,L,T)};function P(C,A){let x=Q.update(k);if(N.defines.VSM_SAMPLES!==C.blurSamples)N.defines.VSM_SAMPLES=C.blurSamples,O.defines.VSM_SAMPLES=C.blurSamples,N.needsUpdate=!0,O.needsUpdate=!0;if(C.mapPass===null)C.mapPass=new Y8(W.x,W.y);N.uniforms.shadow_pass.value=C.map.texture,N.uniforms.resolution.value=C.mapSize,N.uniforms.radius.value=C.radius,J.setRenderTarget(C.mapPass),J.clear(),J.renderBufferDirect(A,null,x,N,k,null),O.uniforms.shadow_pass.value=C.mapPass.texture,O.uniforms.resolution.value=C.mapSize,O.uniforms.radius.value=C.radius,J.setRenderTarget(C.map),J.clear(),J.renderBufferDirect(A,null,x,O,k,null)}function V(C,A,x,z){let L=null,T=x.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(T!==void 0)L=T;else if(L=x.isPointLight===!0?X:Y,J.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let d=L.uuid,c=A.uuid,m=U[d];if(m===void 0)m={},U[d]=m;let o=m[c];if(o===void 0)o=L.clone(),m[c]=o,A.addEventListener("dispose",S);L=o}if(L.visible=A.visible,L.wireframe=A.wireframe,z===i0)L.side=A.shadowSide!==null?A.shadowSide:A.side;else L.side=A.shadowSide!==null?A.shadowSide:G[A.side];if(L.alphaMap=A.alphaMap,L.alphaTest=A.alphaToCoverage===!0?0.5:A.alphaTest,L.map=A.map,L.clipShadows=A.clipShadows,L.clippingPlanes=A.clippingPlanes,L.clipIntersection=A.clipIntersection,L.displacementMap=A.displacementMap,L.displacementScale=A.displacementScale,L.displacementBias=A.displacementBias,L.wireframeLinewidth=A.wireframeLinewidth,L.linewidth=A.linewidth,x.isPointLight===!0&&L.isMeshDistanceMaterial===!0){let d=J.properties.get(L);d.light=x}return L}function I(C,A,x,z,L){if(C.visible===!1)return;if(C.layers.test(A.layers)&&(C.isMesh||C.isLine||C.isPoints)){if((C.castShadow||C.receiveShadow&&L===i0)&&(!C.frustumCulled||Z.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,C.matrixWorld);let c=Q.update(C),m=C.material;if(Array.isArray(m)){let o=c.groups;for(let l=0,r=o.length;l<r;l++){let g=o[l],KJ=m[g.materialIndex];if(KJ&&KJ.visible){let GJ=V(C,KJ,z,L);C.onBeforeShadow(J,C,A,x,c,GJ,g),J.renderBufferDirect(x,null,c,GJ,C,g),C.onAfterShadow(J,C,A,x,c,GJ,g)}}}else if(m.visible){let o=V(C,m,z,L);C.onBeforeShadow(J,C,A,x,c,o,null),J.renderBufferDirect(x,null,c,o,C,null),C.onAfterShadow(J,C,A,x,c,o,null)}}}let d=C.children;for(let c=0,m=d.length;c<m;c++)I(d[c],A,x,z,L)}function S(C){C.target.removeEventListener("dispose",S);for(let x in U){let z=U[x],L=C.target.uuid;if(L in z)z[L].dispose(),delete z[L]}}}var yU={[F6]:M6,[k6]:z6,[V6]:B6,[w9]:L6,[M6]:F6,[z6]:k6,[B6]:V6,[L6]:w9};function vU(J,Q){function $(){let w=!1,YJ=new K0,$J=null,qJ=new K0(0,0,0,0);return{setMask:function(a){if($J!==a&&!w)J.colorMask(a,a,a,a),$J=a},setLocked:function(a){w=a},setClear:function(a,s,OJ,jJ,iJ){if(iJ===!0)a*=jJ,s*=jJ,OJ*=jJ;if(YJ.set(a,s,OJ,jJ),qJ.equals(YJ)===!1)J.clearColor(a,s,OJ,jJ),qJ.copy(YJ)},reset:function(){w=!1,$J=null,qJ.set(-1,0,0,0)}}}function Z(){let w=!1,YJ=!1,$J=null,qJ=null,a=null;return{setReversed:function(s){if(YJ!==s){let OJ=Q.get("EXT_clip_control");if(s)OJ.clipControlEXT(OJ.LOWER_LEFT_EXT,OJ.ZERO_TO_ONE_EXT);else OJ.clipControlEXT(OJ.LOWER_LEFT_EXT,OJ.NEGATIVE_ONE_TO_ONE_EXT);YJ=s;let jJ=a;a=null,this.setClear(jJ)}},getReversed:function(){return YJ},setTest:function(s){if(s)QJ(J.DEPTH_TEST);else MJ(J.DEPTH_TEST)},setMask:function(s){if($J!==s&&!w)J.depthMask(s),$J=s},setFunc:function(s){if(YJ)s=yU[s];if(qJ!==s){switch(s){case F6:J.depthFunc(J.NEVER);break;case M6:J.depthFunc(J.ALWAYS);break;case k6:J.depthFunc(J.LESS);break;case w9:J.depthFunc(J.LEQUAL);break;case V6:J.depthFunc(J.EQUAL);break;case L6:J.depthFunc(J.GEQUAL);break;case z6:J.depthFunc(J.GREATER);break;case B6:J.depthFunc(J.NOTEQUAL);break;default:J.depthFunc(J.LEQUAL)}qJ=s}},setLocked:function(s){w=s},setClear:function(s){if(a!==s){if(YJ)s=1-s;J.clearDepth(s),a=s}},reset:function(){w=!1,$J=null,qJ=null,a=null,YJ=!1}}}function W(){let w=!1,YJ=null,$J=null,qJ=null,a=null,s=null,OJ=null,jJ=null,iJ=null;return{setTest:function(nJ){if(!w)if(nJ)QJ(J.STENCIL_TEST);else MJ(J.STENCIL_TEST)},setMask:function(nJ){if(YJ!==nJ&&!w)J.stencilMask(nJ),YJ=nJ},setFunc:function(nJ,c0,n0){if($J!==nJ||qJ!==c0||a!==n0)J.stencilFunc(nJ,c0,n0),$J=nJ,qJ=c0,a=n0},setOp:function(nJ,c0,n0){if(s!==nJ||OJ!==c0||jJ!==n0)J.stencilOp(nJ,c0,n0),s=nJ,OJ=c0,jJ=n0},setLocked:function(nJ){w=nJ},setClear:function(nJ){if(iJ!==nJ)J.clearStencil(nJ),iJ=nJ},reset:function(){w=!1,YJ=null,$J=null,qJ=null,a=null,s=null,OJ=null,jJ=null,iJ=null}}}let K=new $,H=new Z,Y=new W,X=new WeakMap,U=new WeakMap,E={},G={},N=new WeakMap,O=[],M=null,k=!1,q=null,D=null,P=null,V=null,I=null,S=null,C=null,A=new lJ(0,0,0),x=0,z=!1,L=null,T=null,d=null,c=null,m=null,o=J.getParameter(J.MAX_COMBINED_TEXTURE_IMAGE_UNITS),l=!1,r=0,g=J.getParameter(J.VERSION);if(g.indexOf("WebGL")!==-1)r=parseFloat(/^WebGL (\d)/.exec(g)[1]),l=r>=1;else if(g.indexOf("OpenGL ES")!==-1)r=parseFloat(/^OpenGL ES (\d)/.exec(g)[1]),l=r>=2;let KJ=null,GJ={},PJ=J.getParameter(J.SCISSOR_BOX),xJ=J.getParameter(J.VIEWPORT),Y0=new K0().fromArray(PJ),mJ=new K0().fromArray(xJ);function n(w,YJ,$J,qJ){let a=new Uint8Array(4),s=J.createTexture();J.bindTexture(w,s),J.texParameteri(w,J.TEXTURE_MIN_FILTER,J.NEAREST),J.texParameteri(w,J.TEXTURE_MAG_FILTER,J.NEAREST);for(let OJ=0;OJ<$J;OJ++)if(w===J.TEXTURE_3D||w===J.TEXTURE_2D_ARRAY)J.texImage3D(YJ,0,J.RGBA,1,1,qJ,0,J.RGBA,J.UNSIGNED_BYTE,a);else J.texImage2D(YJ+OJ,0,J.RGBA,1,1,0,J.RGBA,J.UNSIGNED_BYTE,a);return s}let WJ={};WJ[J.TEXTURE_2D]=n(J.TEXTURE_2D,J.TEXTURE_2D,1),WJ[J.TEXTURE_CUBE_MAP]=n(J.TEXTURE_CUBE_MAP,J.TEXTURE_CUBE_MAP_POSITIVE_X,6),WJ[J.TEXTURE_2D_ARRAY]=n(J.TEXTURE_2D_ARRAY,J.TEXTURE_2D_ARRAY,1,1),WJ[J.TEXTURE_3D]=n(J.TEXTURE_3D,J.TEXTURE_3D,1,1),K.setClear(0,0,0,1),H.setClear(1),Y.setClear(0),QJ(J.DEPTH_TEST),H.setFunc(w9),RJ(!1),J0(C7),QJ(J.CULL_FACE),yJ(D8);function QJ(w){if(E[w]!==!0)J.enable(w),E[w]=!0}function MJ(w){if(E[w]!==!1)J.disable(w),E[w]=!1}function TJ(w,YJ){if(G[w]!==YJ){if(J.bindFramebuffer(w,YJ),G[w]=YJ,w===J.DRAW_FRAMEBUFFER)G[J.FRAMEBUFFER]=YJ;if(w===J.FRAMEBUFFER)G[J.DRAW_FRAMEBUFFER]=YJ;return!0}return!1}function SJ(w,YJ){let $J=O,qJ=!1;if(w){if($J=N.get(YJ),$J===void 0)$J=[],N.set(YJ,$J);let a=w.textures;if($J.length!==a.length||$J[0]!==J.COLOR_ATTACHMENT0){for(let s=0,OJ=a.length;s<OJ;s++)$J[s]=J.COLOR_ATTACHMENT0+s;$J.length=a.length,qJ=!0}}else if($J[0]!==J.BACK)$J[0]=J.BACK,qJ=!0;if(qJ)J.drawBuffers($J)}function E0(w){if(M!==w)return J.useProgram(w),M=w,!0;return!1}let _={[Y9]:J.FUNC_ADD,[h$]:J.FUNC_SUBTRACT,[x$]:J.FUNC_REVERSE_SUBTRACT};_[g$]=J.MIN,_[p$]=J.MAX;let eJ={[m$]:J.ZERO,[d$]:J.ONE,[l$]:J.SRC_COLOR,[c$]:J.SRC_ALPHA,[r$]:J.SRC_ALPHA_SATURATE,[o$]:J.DST_COLOR,[s$]:J.DST_ALPHA,[u$]:J.ONE_MINUS_SRC_COLOR,[n$]:J.ONE_MINUS_SRC_ALPHA,[a$]:J.ONE_MINUS_DST_COLOR,[i$]:J.ONE_MINUS_DST_ALPHA,[t$]:J.CONSTANT_COLOR,[e$]:J.ONE_MINUS_CONSTANT_COLOR,[JZ]:J.CONSTANT_ALPHA,[QZ]:J.ONE_MINUS_CONSTANT_ALPHA};function yJ(w,YJ,$J,qJ,a,s,OJ,jJ,iJ,nJ){if(w===D8){if(k===!0)MJ(J.BLEND),k=!1;return}if(k===!1)QJ(J.BLEND),k=!0;if(w!==b$){if(w!==q||nJ!==z){if(D!==Y9||I!==Y9)J.blendEquation(J.FUNC_ADD),D=Y9,I=Y9;if(nJ)switch(w){case C9:J.blendFuncSeparate(J.ONE,J.ONE_MINUS_SRC_ALPHA,J.ONE,J.ONE_MINUS_SRC_ALPHA);break;case K9:J.blendFunc(J.ONE,J.ONE);break;case P7:J.blendFuncSeparate(J.ZERO,J.ONE_MINUS_SRC_COLOR,J.ZERO,J.ONE);break;case A7:J.blendFuncSeparate(J.DST_COLOR,J.ONE_MINUS_SRC_ALPHA,J.ZERO,J.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",w);break}else switch(w){case C9:J.blendFuncSeparate(J.SRC_ALPHA,J.ONE_MINUS_SRC_ALPHA,J.ONE,J.ONE_MINUS_SRC_ALPHA);break;case K9:J.blendFuncSeparate(J.SRC_ALPHA,J.ONE,J.ONE,J.ONE);break;case P7:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case A7:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",w);break}P=null,V=null,S=null,C=null,A.set(0,0,0),x=0,q=w,z=nJ}return}if(a=a||YJ,s=s||$J,OJ=OJ||qJ,YJ!==D||a!==I)J.blendEquationSeparate(_[YJ],_[a]),D=YJ,I=a;if($J!==P||qJ!==V||s!==S||OJ!==C)J.blendFuncSeparate(eJ[$J],eJ[qJ],eJ[s],eJ[OJ]),P=$J,V=qJ,S=s,C=OJ;if(jJ.equals(A)===!1||iJ!==x)J.blendColor(jJ.r,jJ.g,jJ.b,iJ),A.copy(jJ),x=iJ;q=w,z=!1}function AJ(w,YJ){w.side===o0?MJ(J.CULL_FACE):QJ(J.CULL_FACE);let $J=w.side===T0;if(YJ)$J=!$J;RJ($J),w.blending===C9&&w.transparent===!1?yJ(D8):yJ(w.blending,w.blendEquation,w.blendSrc,w.blendDst,w.blendEquationAlpha,w.blendSrcAlpha,w.blendDstAlpha,w.blendColor,w.blendAlpha,w.premultipliedAlpha),H.setFunc(w.depthFunc),H.setTest(w.depthTest),H.setMask(w.depthWrite),K.setMask(w.colorWrite);let qJ=w.stencilWrite;if(Y.setTest(qJ),qJ)Y.setMask(w.stencilWriteMask),Y.setFunc(w.stencilFunc,w.stencilRef,w.stencilFuncMask),Y.setOp(w.stencilFail,w.stencilZFail,w.stencilZPass);IJ(w.polygonOffset,w.polygonOffsetFactor,w.polygonOffsetUnits),w.alphaToCoverage===!0?QJ(J.SAMPLE_ALPHA_TO_COVERAGE):MJ(J.SAMPLE_ALPHA_TO_COVERAGE)}function RJ(w){if(L!==w){if(w)J.frontFace(J.CW);else J.frontFace(J.CCW);L=w}}function J0(w){if(w!==y$){if(QJ(J.CULL_FACE),w!==T)if(w===C7)J.cullFace(J.BACK);else if(w===v$)J.cullFace(J.FRONT);else J.cullFace(J.FRONT_AND_BACK)}else MJ(J.CULL_FACE);T=w}function LJ(w){if(w!==d){if(l)J.lineWidth(w);d=w}}function IJ(w,YJ,$J){if(w){if(QJ(J.POLYGON_OFFSET_FILL),c!==YJ||m!==$J)J.polygonOffset(YJ,$J),c=YJ,m=$J}else MJ(J.POLYGON_OFFSET_FILL)}function O0(w){if(w)QJ(J.SCISSOR_TEST);else MJ(J.SCISSOR_TEST)}function N0(w){if(w===void 0)w=J.TEXTURE0+o-1;if(KJ!==w)J.activeTexture(w),KJ=w}function H0(w,YJ,$J){if($J===void 0)if(KJ===null)$J=J.TEXTURE0+o-1;else $J=KJ;let qJ=GJ[$J];if(qJ===void 0)qJ={type:void 0,texture:void 0},GJ[$J]=qJ;if(qJ.type!==w||qJ.texture!==YJ){if(KJ!==$J)J.activeTexture($J),KJ=$J;J.bindTexture(w,YJ||WJ[w]),qJ.type=w,qJ.texture=YJ}}function B(){let w=GJ[KJ];if(w!==void 0&&w.type!==void 0)J.bindTexture(w.type,null),w.type=void 0,w.texture=void 0}function R(){try{J.compressedTexImage2D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function v(){try{J.compressedTexImage3D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function u(){try{J.texSubImage2D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function i(){try{J.texSubImage3D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function p(){try{J.compressedTexSubImage2D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function NJ(){try{J.compressedTexSubImage3D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function JJ(){try{J.texStorage2D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function FJ(){try{J.texStorage3D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function CJ(){try{J.texImage2D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function e(){try{J.texImage3D(...arguments)}catch(w){console.error("THREE.WebGLState:",w)}}function XJ(w){if(Y0.equals(w)===!1)J.scissor(w.x,w.y,w.z,w.w),Y0.copy(w)}function kJ(w){if(mJ.equals(w)===!1)J.viewport(w.x,w.y,w.z,w.w),mJ.copy(w)}function VJ(w,YJ){let $J=U.get(YJ);if($J===void 0)$J=new WeakMap,U.set(YJ,$J);let qJ=$J.get(w);if(qJ===void 0)qJ=J.getUniformBlockIndex(YJ,w.name),$J.set(w,qJ)}function UJ(w,YJ){let qJ=U.get(YJ).get(w);if(X.get(YJ)!==qJ)J.uniformBlockBinding(YJ,qJ,w.__bindingPointIndex),X.set(YJ,qJ)}function bJ(){J.disable(J.BLEND),J.disable(J.CULL_FACE),J.disable(J.DEPTH_TEST),J.disable(J.POLYGON_OFFSET_FILL),J.disable(J.SCISSOR_TEST),J.disable(J.STENCIL_TEST),J.disable(J.SAMPLE_ALPHA_TO_COVERAGE),J.blendEquation(J.FUNC_ADD),J.blendFunc(J.ONE,J.ZERO),J.blendFuncSeparate(J.ONE,J.ZERO,J.ONE,J.ZERO),J.blendColor(0,0,0,0),J.colorMask(!0,!0,!0,!0),J.clearColor(0,0,0,0),J.depthMask(!0),J.depthFunc(J.LESS),H.setReversed(!1),J.clearDepth(1),J.stencilMask(4294967295),J.stencilFunc(J.ALWAYS,0,4294967295),J.stencilOp(J.KEEP,J.KEEP,J.KEEP),J.clearStencil(0),J.cullFace(J.BACK),J.frontFace(J.CCW),J.polygonOffset(0,0),J.activeTexture(J.TEXTURE0),J.bindFramebuffer(J.FRAMEBUFFER,null),J.bindFramebuffer(J.DRAW_FRAMEBUFFER,null),J.bindFramebuffer(J.READ_FRAMEBUFFER,null),J.useProgram(null),J.lineWidth(1),J.scissor(0,0,J.canvas.width,J.canvas.height),J.viewport(0,0,J.canvas.width,J.canvas.height),E={},KJ=null,GJ={},G={},N=new WeakMap,O=[],M=null,k=!1,q=null,D=null,P=null,V=null,I=null,S=null,C=null,A=new lJ(0,0,0),x=0,z=!1,L=null,T=null,d=null,c=null,m=null,Y0.set(0,0,J.canvas.width,J.canvas.height),mJ.set(0,0,J.canvas.width,J.canvas.height),K.reset(),H.reset(),Y.reset()}return{buffers:{color:K,depth:H,stencil:Y},enable:QJ,disable:MJ,bindFramebuffer:TJ,drawBuffers:SJ,useProgram:E0,setBlending:yJ,setMaterial:AJ,setFlipSided:RJ,setCullFace:J0,setLineWidth:LJ,setPolygonOffset:IJ,setScissorTest:O0,activeTexture:N0,bindTexture:H0,unbindTexture:B,compressedTexImage2D:R,compressedTexImage3D:v,texImage2D:CJ,texImage3D:e,updateUBOMapping:VJ,uniformBlockBinding:UJ,texStorage2D:JJ,texStorage3D:FJ,texSubImage2D:u,texSubImage3D:i,compressedTexSubImage2D:p,compressedTexSubImage3D:NJ,scissor:XJ,viewport:kJ,reset:bJ}}function fU(J,Q,$,Z,W,K,H){let Y=Q.has("WEBGL_multisampled_render_to_texture")?Q.get("WEBGL_multisampled_render_to_texture"):null,X=typeof navigator==="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),U=new cJ,E=new WeakMap,G,N=new WeakMap,O=!1;try{O=typeof OffscreenCanvas!=="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(B){}function M(B,R){return O?new OffscreenCanvas(B,R):_9("canvas")}function k(B,R,v){let u=1,i=H0(B);if(i.width>v||i.height>v)u=v/Math.max(i.width,i.height);if(u<1)if(typeof HTMLImageElement!=="undefined"&&B instanceof HTMLImageElement||typeof HTMLCanvasElement!=="undefined"&&B instanceof HTMLCanvasElement||typeof ImageBitmap!=="undefined"&&B instanceof ImageBitmap||typeof VideoFrame!=="undefined"&&B instanceof VideoFrame){let p=Math.floor(u*i.width),NJ=Math.floor(u*i.height);if(G===void 0)G=M(p,NJ);let JJ=R?M(p,NJ):G;return JJ.width=p,JJ.height=NJ,JJ.getContext("2d").drawImage(B,0,0,p,NJ),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+i.width+"x"+i.height+") to ("+p+"x"+NJ+")."),JJ}else{if("data"in B)console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+i.width+"x"+i.height+").");return B}return B}function q(B){return B.generateMipmaps}function D(B){J.generateMipmap(B)}function P(B){if(B.isWebGLCubeRenderTarget)return J.TEXTURE_CUBE_MAP;if(B.isWebGL3DRenderTarget)return J.TEXTURE_3D;if(B.isWebGLArrayRenderTarget||B.isCompressedArrayTexture)return J.TEXTURE_2D_ARRAY;return J.TEXTURE_2D}function V(B,R,v,u,i=!1){if(B!==null){if(J[B]!==void 0)return J[B];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+B+"'")}let p=R;if(R===J.RED){if(v===J.FLOAT)p=J.R32F;if(v===J.HALF_FLOAT)p=J.R16F;if(v===J.UNSIGNED_BYTE)p=J.R8}if(R===J.RED_INTEGER){if(v===J.UNSIGNED_BYTE)p=J.R8UI;if(v===J.UNSIGNED_SHORT)p=J.R16UI;if(v===J.UNSIGNED_INT)p=J.R32UI;if(v===J.BYTE)p=J.R8I;if(v===J.SHORT)p=J.R16I;if(v===J.INT)p=J.R32I}if(R===J.RG){if(v===J.FLOAT)p=J.RG32F;if(v===J.HALF_FLOAT)p=J.RG16F;if(v===J.UNSIGNED_BYTE)p=J.RG8}if(R===J.RG_INTEGER){if(v===J.UNSIGNED_BYTE)p=J.RG8UI;if(v===J.UNSIGNED_SHORT)p=J.RG16UI;if(v===J.UNSIGNED_INT)p=J.RG32UI;if(v===J.BYTE)p=J.RG8I;if(v===J.SHORT)p=J.RG16I;if(v===J.INT)p=J.RG32I}if(R===J.RGB_INTEGER){if(v===J.UNSIGNED_BYTE)p=J.RGB8UI;if(v===J.UNSIGNED_SHORT)p=J.RGB16UI;if(v===J.UNSIGNED_INT)p=J.RGB32UI;if(v===J.BYTE)p=J.RGB8I;if(v===J.SHORT)p=J.RGB16I;if(v===J.INT)p=J.RGB32I}if(R===J.RGBA_INTEGER){if(v===J.UNSIGNED_BYTE)p=J.RGBA8UI;if(v===J.UNSIGNED_SHORT)p=J.RGBA16UI;if(v===J.UNSIGNED_INT)p=J.RGBA32UI;if(v===J.BYTE)p=J.RGBA8I;if(v===J.SHORT)p=J.RGBA16I;if(v===J.INT)p=J.RGBA32I}if(R===J.RGB){if(v===J.UNSIGNED_INT_5_9_9_9_REV)p=J.RGB9_E5;if(v===J.UNSIGNED_INT_10F_11F_11F_REV)p=J.R11F_G11F_B10F}if(R===J.RGBA){let NJ=i?GQ:pJ.getTransfer(u);if(v===J.FLOAT)p=J.RGBA32F;if(v===J.HALF_FLOAT)p=J.RGBA16F;if(v===J.UNSIGNED_BYTE)p=NJ===rJ?J.SRGB8_ALPHA8:J.RGBA8;if(v===J.UNSIGNED_SHORT_4_4_4_4)p=J.RGBA4;if(v===J.UNSIGNED_SHORT_5_5_5_1)p=J.RGB5_A1}if(p===J.R16F||p===J.R32F||p===J.RG16F||p===J.RG32F||p===J.RGBA16F||p===J.RGBA32F)Q.get("EXT_color_buffer_float");return p}function I(B,R){let v;if(B){if(R===null||R===G9||R===E9)v=J.DEPTH24_STENCIL8;else if(R===R8)v=J.DEPTH32F_STENCIL8;else if(R===T9)v=J.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")}else if(R===null||R===G9||R===E9)v=J.DEPTH_COMPONENT24;else if(R===R8)v=J.DEPTH_COMPONENT32F;else if(R===T9)v=J.DEPTH_COMPONENT16;return v}function S(B,R){if(q(B)===!0||B.isFramebufferTexture&&B.minFilter!==X9&&B.minFilter!==A8)return Math.log2(Math.max(R.width,R.height))+1;else if(B.mipmaps!==void 0&&B.mipmaps.length>0)return B.mipmaps.length;else if(B.isCompressedTexture&&Array.isArray(B.image))return R.mipmaps.length;else return 1}function C(B){let R=B.target;if(R.removeEventListener("dispose",C),x(R),R.isVideoTexture)E.delete(R)}function A(B){let R=B.target;R.removeEventListener("dispose",A),L(R)}function x(B){let R=Z.get(B);if(R.__webglInit===void 0)return;let v=B.source,u=N.get(v);if(u){let i=u[R.__cacheKey];if(i.usedTimes--,i.usedTimes===0)z(B);if(Object.keys(u).length===0)N.delete(v)}Z.remove(B)}function z(B){let R=Z.get(B);J.deleteTexture(R.__webglTexture);let v=B.source,u=N.get(v);delete u[R.__cacheKey],H.memory.textures--}function L(B){let R=Z.get(B);if(B.depthTexture)B.depthTexture.dispose(),Z.remove(B.depthTexture);if(B.isWebGLCubeRenderTarget)for(let u=0;u<6;u++){if(Array.isArray(R.__webglFramebuffer[u]))for(let i=0;i<R.__webglFramebuffer[u].length;i++)J.deleteFramebuffer(R.__webglFramebuffer[u][i]);else J.deleteFramebuffer(R.__webglFramebuffer[u]);if(R.__webglDepthbuffer)J.deleteRenderbuffer(R.__webglDepthbuffer[u])}else{if(Array.isArray(R.__webglFramebuffer))for(let u=0;u<R.__webglFramebuffer.length;u++)J.deleteFramebuffer(R.__webglFramebuffer[u]);else J.deleteFramebuffer(R.__webglFramebuffer);if(R.__webglDepthbuffer)J.deleteRenderbuffer(R.__webglDepthbuffer);if(R.__webglMultisampledFramebuffer)J.deleteFramebuffer(R.__webglMultisampledFramebuffer);if(R.__webglColorRenderbuffer){for(let u=0;u<R.__webglColorRenderbuffer.length;u++)if(R.__webglColorRenderbuffer[u])J.deleteRenderbuffer(R.__webglColorRenderbuffer[u])}if(R.__webglDepthRenderbuffer)J.deleteRenderbuffer(R.__webglDepthRenderbuffer)}let v=B.textures;for(let u=0,i=v.length;u<i;u++){let p=Z.get(v[u]);if(p.__webglTexture)J.deleteTexture(p.__webglTexture),H.memory.textures--;Z.remove(v[u])}Z.remove(B)}let T=0;function d(){T=0}function c(){let B=T;if(B>=W.maxTextures)console.warn("THREE.WebGLTextures: Trying to use "+B+" texture units while this GPU supports only "+W.maxTextures);return T+=1,B}function m(B){let R=[];return R.push(B.wrapS),R.push(B.wrapT),R.push(B.wrapR||0),R.push(B.magFilter),R.push(B.minFilter),R.push(B.anisotropy),R.push(B.internalFormat),R.push(B.format),R.push(B.type),R.push(B.generateMipmaps),R.push(B.premultiplyAlpha),R.push(B.flipY),R.push(B.unpackAlignment),R.push(B.colorSpace),R.join()}function o(B,R){let v=Z.get(B);if(B.isVideoTexture)O0(B);if(B.isRenderTargetTexture===!1&&B.isExternalTexture!==!0&&B.version>0&&v.__version!==B.version){let u=B.image;if(u===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(u.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{WJ(v,B,R);return}}else if(B.isExternalTexture)v.__webglTexture=B.sourceTexture?B.sourceTexture:null;$.bindTexture(J.TEXTURE_2D,v.__webglTexture,J.TEXTURE0+R)}function l(B,R){let v=Z.get(B);if(B.isRenderTargetTexture===!1&&B.version>0&&v.__version!==B.version){WJ(v,B,R);return}$.bindTexture(J.TEXTURE_2D_ARRAY,v.__webglTexture,J.TEXTURE0+R)}function r(B,R){let v=Z.get(B);if(B.isRenderTargetTexture===!1&&B.version>0&&v.__version!==B.version){WJ(v,B,R);return}$.bindTexture(J.TEXTURE_3D,v.__webglTexture,J.TEXTURE0+R)}function g(B,R){let v=Z.get(B);if(B.version>0&&v.__version!==B.version){QJ(v,B,R);return}$.bindTexture(J.TEXTURE_CUBE_MAP,v.__webglTexture,J.TEXTURE0+R)}let KJ={[NZ]:J.REPEAT,[qZ]:J.CLAMP_TO_EDGE,[DZ]:J.MIRRORED_REPEAT},GJ={[X9]:J.NEAREST,[OZ]:J.NEAREST_MIPMAP_NEAREST,[A9]:J.NEAREST_MIPMAP_LINEAR,[A8]:J.LINEAR,[C6]:J.LINEAR_MIPMAP_NEAREST,[U9]:J.LINEAR_MIPMAP_LINEAR},PJ={[PZ]:J.NEVER,[vZ]:J.ALWAYS,[AZ]:J.LESS,[EQ]:J.LEQUAL,[TZ]:J.EQUAL,[yZ]:J.GEQUAL,[SZ]:J.GREATER,[jZ]:J.NOTEQUAL};function xJ(B,R){if(R.type===R8&&Q.has("OES_texture_float_linear")===!1&&(R.magFilter===A8||R.magFilter===C6||R.magFilter===A9||R.magFilter===U9||R.minFilter===A8||R.minFilter===C6||R.minFilter===A9||R.minFilter===U9))console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.");if(J.texParameteri(B,J.TEXTURE_WRAP_S,KJ[R.wrapS]),J.texParameteri(B,J.TEXTURE_WRAP_T,KJ[R.wrapT]),B===J.TEXTURE_3D||B===J.TEXTURE_2D_ARRAY)J.texParameteri(B,J.TEXTURE_WRAP_R,KJ[R.wrapR]);if(J.texParameteri(B,J.TEXTURE_MAG_FILTER,GJ[R.magFilter]),J.texParameteri(B,J.TEXTURE_MIN_FILTER,GJ[R.minFilter]),R.compareFunction)J.texParameteri(B,J.TEXTURE_COMPARE_MODE,J.COMPARE_REF_TO_TEXTURE),J.texParameteri(B,J.TEXTURE_COMPARE_FUNC,PJ[R.compareFunction]);if(Q.has("EXT_texture_filter_anisotropic")===!0){if(R.magFilter===X9)return;if(R.minFilter!==A9&&R.minFilter!==U9)return;if(R.type===R8&&Q.has("OES_texture_float_linear")===!1)return;if(R.anisotropy>1||Z.get(R).__currentAnisotropy){let v=Q.get("EXT_texture_filter_anisotropic");J.texParameterf(B,v.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(R.anisotropy,W.getMaxAnisotropy())),Z.get(R).__currentAnisotropy=R.anisotropy}}}function Y0(B,R){let v=!1;if(B.__webglInit===void 0)B.__webglInit=!0,R.addEventListener("dispose",C);let u=R.source,i=N.get(u);if(i===void 0)i={},N.set(u,i);let p=m(R);if(p!==B.__cacheKey){if(i[p]===void 0)i[p]={texture:J.createTexture(),usedTimes:0},H.memory.textures++,v=!0;i[p].usedTimes++;let NJ=i[B.__cacheKey];if(NJ!==void 0){if(i[B.__cacheKey].usedTimes--,NJ.usedTimes===0)z(R)}B.__cacheKey=p,B.__webglTexture=i[p].texture}return v}function mJ(B,R,v){return Math.floor(Math.floor(B/v)/R)}function n(B,R,v,u){let p=B.updateRanges;if(p.length===0)$.texSubImage2D(J.TEXTURE_2D,0,0,0,R.width,R.height,v,u,R.data);else{p.sort((e,XJ)=>e.start-XJ.start);let NJ=0;for(let e=1;e<p.length;e++){let XJ=p[NJ],kJ=p[e],VJ=XJ.start+XJ.count,UJ=mJ(kJ.start,R.width,4),bJ=mJ(XJ.start,R.width,4);if(kJ.start<=VJ+1&&UJ===bJ&&mJ(kJ.start+kJ.count-1,R.width,4)===UJ)XJ.count=Math.max(XJ.count,kJ.start+kJ.count-XJ.start);else++NJ,p[NJ]=kJ}p.length=NJ+1;let JJ=J.getParameter(J.UNPACK_ROW_LENGTH),FJ=J.getParameter(J.UNPACK_SKIP_PIXELS),CJ=J.getParameter(J.UNPACK_SKIP_ROWS);J.pixelStorei(J.UNPACK_ROW_LENGTH,R.width);for(let e=0,XJ=p.length;e<XJ;e++){let kJ=p[e],VJ=Math.floor(kJ.start/4),UJ=Math.ceil(kJ.count/4),bJ=VJ%R.width,w=Math.floor(VJ/R.width),YJ=UJ,$J=1;J.pixelStorei(J.UNPACK_SKIP_PIXELS,bJ),J.pixelStorei(J.UNPACK_SKIP_ROWS,w),$.texSubImage2D(J.TEXTURE_2D,0,bJ,w,YJ,1,v,u,R.data)}B.clearUpdateRanges(),J.pixelStorei(J.UNPACK_ROW_LENGTH,JJ),J.pixelStorei(J.UNPACK_SKIP_PIXELS,FJ),J.pixelStorei(J.UNPACK_SKIP_ROWS,CJ)}}function WJ(B,R,v){let u=J.TEXTURE_2D;if(R.isDataArrayTexture||R.isCompressedArrayTexture)u=J.TEXTURE_2D_ARRAY;if(R.isData3DTexture)u=J.TEXTURE_3D;let i=Y0(B,R),p=R.source;$.bindTexture(u,B.__webglTexture,J.TEXTURE0+v);let NJ=Z.get(p);if(p.version!==NJ.__version||i===!0){$.activeTexture(J.TEXTURE0+v);let JJ=pJ.getPrimaries(pJ.workingColorSpace),FJ=R.colorSpace===T8?null:pJ.getPrimaries(R.colorSpace),CJ=R.colorSpace===T8||JJ===FJ?J.NONE:J.BROWSER_DEFAULT_WEBGL;J.pixelStorei(J.UNPACK_FLIP_Y_WEBGL,R.flipY),J.pixelStorei(J.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),J.pixelStorei(J.UNPACK_ALIGNMENT,R.unpackAlignment),J.pixelStorei(J.UNPACK_COLORSPACE_CONVERSION_WEBGL,CJ);let e=k(R.image,!1,W.maxTextureSize);e=N0(R,e);let XJ=K.convert(R.format,R.colorSpace),kJ=K.convert(R.type),VJ=V(R.internalFormat,XJ,kJ,R.colorSpace,R.isVideoTexture);xJ(u,R);let UJ,bJ=R.mipmaps,w=R.isVideoTexture!==!0,YJ=NJ.__version===void 0||i===!0,$J=p.dataReady,qJ=S(R,e);if(R.isDepthTexture){if(VJ=I(R.format===j9,R.type),YJ)if(w)$.texStorage2D(J.TEXTURE_2D,1,VJ,e.width,e.height);else $.texImage2D(J.TEXTURE_2D,0,VJ,e.width,e.height,0,XJ,kJ,null)}else if(R.isDataTexture)if(bJ.length>0){if(w&&YJ)$.texStorage2D(J.TEXTURE_2D,qJ,VJ,bJ[0].width,bJ[0].height);for(let a=0,s=bJ.length;a<s;a++)if(UJ=bJ[a],w){if($J)$.texSubImage2D(J.TEXTURE_2D,a,0,0,UJ.width,UJ.height,XJ,kJ,UJ.data)}else $.texImage2D(J.TEXTURE_2D,a,VJ,UJ.width,UJ.height,0,XJ,kJ,UJ.data);R.generateMipmaps=!1}else if(w){if(YJ)$.texStorage2D(J.TEXTURE_2D,qJ,VJ,e.width,e.height);if($J)n(R,e,XJ,kJ)}else $.texImage2D(J.TEXTURE_2D,0,VJ,e.width,e.height,0,XJ,kJ,e.data);else if(R.isCompressedTexture)if(R.isCompressedArrayTexture){if(w&&YJ)$.texStorage3D(J.TEXTURE_2D_ARRAY,qJ,VJ,bJ[0].width,bJ[0].height,e.depth);for(let a=0,s=bJ.length;a<s;a++)if(UJ=bJ[a],R.format!==a0)if(XJ!==null)if(w){if($J)if(R.layerUpdates.size>0){let OJ=gQ(UJ.width,UJ.height,R.format,R.type);for(let jJ of R.layerUpdates){let iJ=UJ.data.subarray(jJ*OJ/UJ.data.BYTES_PER_ELEMENT,(jJ+1)*OJ/UJ.data.BYTES_PER_ELEMENT);$.compressedTexSubImage3D(J.TEXTURE_2D_ARRAY,a,0,0,jJ,UJ.width,UJ.height,1,XJ,iJ)}R.clearLayerUpdates()}else $.compressedTexSubImage3D(J.TEXTURE_2D_ARRAY,a,0,0,0,UJ.width,UJ.height,e.depth,XJ,UJ.data)}else $.compressedTexImage3D(J.TEXTURE_2D_ARRAY,a,VJ,UJ.width,UJ.height,e.depth,0,UJ.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(w){if($J)$.texSubImage3D(J.TEXTURE_2D_ARRAY,a,0,0,0,UJ.width,UJ.height,e.depth,XJ,kJ,UJ.data)}else $.texImage3D(J.TEXTURE_2D_ARRAY,a,VJ,UJ.width,UJ.height,e.depth,0,XJ,kJ,UJ.data)}else{if(w&&YJ)$.texStorage2D(J.TEXTURE_2D,qJ,VJ,bJ[0].width,bJ[0].height);for(let a=0,s=bJ.length;a<s;a++)if(UJ=bJ[a],R.format!==a0)if(XJ!==null)if(w){if($J)$.compressedTexSubImage2D(J.TEXTURE_2D,a,0,0,UJ.width,UJ.height,XJ,UJ.data)}else $.compressedTexImage2D(J.TEXTURE_2D,a,VJ,UJ.width,UJ.height,0,UJ.data);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(w){if($J)$.texSubImage2D(J.TEXTURE_2D,a,0,0,UJ.width,UJ.height,XJ,kJ,UJ.data)}else $.texImage2D(J.TEXTURE_2D,a,VJ,UJ.width,UJ.height,0,XJ,kJ,UJ.data)}else if(R.isDataArrayTexture)if(w){if(YJ)$.texStorage3D(J.TEXTURE_2D_ARRAY,qJ,VJ,e.width,e.height,e.depth);if($J)if(R.layerUpdates.size>0){let a=gQ(e.width,e.height,R.format,R.type);for(let s of R.layerUpdates){let OJ=e.data.subarray(s*a/e.data.BYTES_PER_ELEMENT,(s+1)*a/e.data.BYTES_PER_ELEMENT);$.texSubImage3D(J.TEXTURE_2D_ARRAY,0,0,0,s,e.width,e.height,1,XJ,kJ,OJ)}R.clearLayerUpdates()}else $.texSubImage3D(J.TEXTURE_2D_ARRAY,0,0,0,0,e.width,e.height,e.depth,XJ,kJ,e.data)}else $.texImage3D(J.TEXTURE_2D_ARRAY,0,VJ,e.width,e.height,e.depth,0,XJ,kJ,e.data);else if(R.isData3DTexture)if(w){if(YJ)$.texStorage3D(J.TEXTURE_3D,qJ,VJ,e.width,e.height,e.depth);if($J)$.texSubImage3D(J.TEXTURE_3D,0,0,0,0,e.width,e.height,e.depth,XJ,kJ,e.data)}else $.texImage3D(J.TEXTURE_3D,0,VJ,e.width,e.height,e.depth,0,XJ,kJ,e.data);else if(R.isFramebufferTexture){if(YJ)if(w)$.texStorage2D(J.TEXTURE_2D,qJ,VJ,e.width,e.height);else{let{width:a,height:s}=e;for(let OJ=0;OJ<qJ;OJ++)$.texImage2D(J.TEXTURE_2D,OJ,VJ,a,s,0,XJ,kJ,null),a>>=1,s>>=1}}else if(bJ.length>0){if(w&&YJ){let a=H0(bJ[0]);$.texStorage2D(J.TEXTURE_2D,qJ,VJ,a.width,a.height)}for(let a=0,s=bJ.length;a<s;a++)if(UJ=bJ[a],w){if($J)$.texSubImage2D(J.TEXTURE_2D,a,0,0,XJ,kJ,UJ)}else $.texImage2D(J.TEXTURE_2D,a,VJ,XJ,kJ,UJ);R.generateMipmaps=!1}else if(w){if(YJ){let a=H0(e);$.texStorage2D(J.TEXTURE_2D,qJ,VJ,a.width,a.height)}if($J)$.texSubImage2D(J.TEXTURE_2D,0,0,0,XJ,kJ,e)}else $.texImage2D(J.TEXTURE_2D,0,VJ,XJ,kJ,e);if(q(R))D(u);if(NJ.__version=p.version,R.onUpdate)R.onUpdate(R)}B.__version=R.version}function QJ(B,R,v){if(R.image.length!==6)return;let u=Y0(B,R),i=R.source;$.bindTexture(J.TEXTURE_CUBE_MAP,B.__webglTexture,J.TEXTURE0+v);let p=Z.get(i);if(i.version!==p.__version||u===!0){$.activeTexture(J.TEXTURE0+v);let NJ=pJ.getPrimaries(pJ.workingColorSpace),JJ=R.colorSpace===T8?null:pJ.getPrimaries(R.colorSpace),FJ=R.colorSpace===T8||NJ===JJ?J.NONE:J.BROWSER_DEFAULT_WEBGL;J.pixelStorei(J.UNPACK_FLIP_Y_WEBGL,R.flipY),J.pixelStorei(J.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),J.pixelStorei(J.UNPACK_ALIGNMENT,R.unpackAlignment),J.pixelStorei(J.UNPACK_COLORSPACE_CONVERSION_WEBGL,FJ);let CJ=R.isCompressedTexture||R.image[0].isCompressedTexture,e=R.image[0]&&R.image[0].isDataTexture,XJ=[];for(let s=0;s<6;s++){if(!CJ&&!e)XJ[s]=k(R.image[s],!0,W.maxCubemapSize);else XJ[s]=e?R.image[s].image:R.image[s];XJ[s]=N0(R,XJ[s])}let kJ=XJ[0],VJ=K.convert(R.format,R.colorSpace),UJ=K.convert(R.type),bJ=V(R.internalFormat,VJ,UJ,R.colorSpace),w=R.isVideoTexture!==!0,YJ=p.__version===void 0||u===!0,$J=i.dataReady,qJ=S(R,kJ);xJ(J.TEXTURE_CUBE_MAP,R);let a;if(CJ){if(w&&YJ)$.texStorage2D(J.TEXTURE_CUBE_MAP,qJ,bJ,kJ.width,kJ.height);for(let s=0;s<6;s++){a=XJ[s].mipmaps;for(let OJ=0;OJ<a.length;OJ++){let jJ=a[OJ];if(R.format!==a0)if(VJ!==null)if(w){if($J)$.compressedTexSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,OJ,0,0,jJ.width,jJ.height,VJ,jJ.data)}else $.compressedTexImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,OJ,bJ,jJ.width,jJ.height,0,jJ.data);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");else if(w){if($J)$.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,OJ,0,0,jJ.width,jJ.height,VJ,UJ,jJ.data)}else $.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,OJ,bJ,jJ.width,jJ.height,0,VJ,UJ,jJ.data)}}}else{if(a=R.mipmaps,w&&YJ){if(a.length>0)qJ++;let s=H0(XJ[0]);$.texStorage2D(J.TEXTURE_CUBE_MAP,qJ,bJ,s.width,s.height)}for(let s=0;s<6;s++)if(e){if(w){if($J)$.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,0,0,0,XJ[s].width,XJ[s].height,VJ,UJ,XJ[s].data)}else $.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,0,bJ,XJ[s].width,XJ[s].height,0,VJ,UJ,XJ[s].data);for(let OJ=0;OJ<a.length;OJ++){let iJ=a[OJ].image[s].image;if(w){if($J)$.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,OJ+1,0,0,iJ.width,iJ.height,VJ,UJ,iJ.data)}else $.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,OJ+1,bJ,iJ.width,iJ.height,0,VJ,UJ,iJ.data)}}else{if(w){if($J)$.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,0,0,0,VJ,UJ,XJ[s])}else $.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,0,bJ,VJ,UJ,XJ[s]);for(let OJ=0;OJ<a.length;OJ++){let jJ=a[OJ];if(w){if($J)$.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,OJ+1,0,0,VJ,UJ,jJ.image[s])}else $.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+s,OJ+1,bJ,VJ,UJ,jJ.image[s])}}}if(q(R))D(J.TEXTURE_CUBE_MAP);if(p.__version=i.version,R.onUpdate)R.onUpdate(R)}B.__version=R.version}function MJ(B,R,v,u,i,p){let NJ=K.convert(v.format,v.colorSpace),JJ=K.convert(v.type),FJ=V(v.internalFormat,NJ,JJ,v.colorSpace),CJ=Z.get(R),e=Z.get(v);if(e.__renderTarget=R,!CJ.__hasExternalTextures){let XJ=Math.max(1,R.width>>p),kJ=Math.max(1,R.height>>p);if(i===J.TEXTURE_3D||i===J.TEXTURE_2D_ARRAY)$.texImage3D(i,p,FJ,XJ,kJ,R.depth,0,NJ,JJ,null);else $.texImage2D(i,p,FJ,XJ,kJ,0,NJ,JJ,null)}if($.bindFramebuffer(J.FRAMEBUFFER,B),IJ(R))Y.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,u,i,e.__webglTexture,0,LJ(R));else if(i===J.TEXTURE_2D||i>=J.TEXTURE_CUBE_MAP_POSITIVE_X&&i<=J.TEXTURE_CUBE_MAP_NEGATIVE_Z)J.framebufferTexture2D(J.FRAMEBUFFER,u,i,e.__webglTexture,p);$.bindFramebuffer(J.FRAMEBUFFER,null)}function TJ(B,R,v){if(J.bindRenderbuffer(J.RENDERBUFFER,B),R.depthBuffer){let u=R.depthTexture,i=u&&u.isDepthTexture?u.type:null,p=I(R.stencilBuffer,i),NJ=R.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT,JJ=LJ(R);if(IJ(R))Y.renderbufferStorageMultisampleEXT(J.RENDERBUFFER,JJ,p,R.width,R.height);else if(v)J.renderbufferStorageMultisample(J.RENDERBUFFER,JJ,p,R.width,R.height);else J.renderbufferStorage(J.RENDERBUFFER,p,R.width,R.height);J.framebufferRenderbuffer(J.FRAMEBUFFER,NJ,J.RENDERBUFFER,B)}else{let u=R.textures;for(let i=0;i<u.length;i++){let p=u[i],NJ=K.convert(p.format,p.colorSpace),JJ=K.convert(p.type),FJ=V(p.internalFormat,NJ,JJ,p.colorSpace),CJ=LJ(R);if(v&&IJ(R)===!1)J.renderbufferStorageMultisample(J.RENDERBUFFER,CJ,FJ,R.width,R.height);else if(IJ(R))Y.renderbufferStorageMultisampleEXT(J.RENDERBUFFER,CJ,FJ,R.width,R.height);else J.renderbufferStorage(J.RENDERBUFFER,FJ,R.width,R.height)}}J.bindRenderbuffer(J.RENDERBUFFER,null)}function SJ(B,R){if(R&&R.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if($.bindFramebuffer(J.FRAMEBUFFER,B),!(R.depthTexture&&R.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let u=Z.get(R.depthTexture);if(u.__renderTarget=R,!u.__webglTexture||R.depthTexture.image.width!==R.width||R.depthTexture.image.height!==R.height)R.depthTexture.image.width=R.width,R.depthTexture.image.height=R.height,R.depthTexture.needsUpdate=!0;o(R.depthTexture,0);let i=u.__webglTexture,p=LJ(R);if(R.depthTexture.format===w6)if(IJ(R))Y.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,J.DEPTH_ATTACHMENT,J.TEXTURE_2D,i,0,p);else J.framebufferTexture2D(J.FRAMEBUFFER,J.DEPTH_ATTACHMENT,J.TEXTURE_2D,i,0);else if(R.depthTexture.format===j9)if(IJ(R))Y.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,J.DEPTH_STENCIL_ATTACHMENT,J.TEXTURE_2D,i,0,p);else J.framebufferTexture2D(J.FRAMEBUFFER,J.DEPTH_STENCIL_ATTACHMENT,J.TEXTURE_2D,i,0);else throw new Error("Unknown depthTexture format")}function E0(B){let R=Z.get(B),v=B.isWebGLCubeRenderTarget===!0;if(R.__boundDepthTexture!==B.depthTexture){let u=B.depthTexture;if(R.__depthDisposeCallback)R.__depthDisposeCallback();if(u){let i=()=>{delete R.__boundDepthTexture,delete R.__depthDisposeCallback,u.removeEventListener("dispose",i)};u.addEventListener("dispose",i),R.__depthDisposeCallback=i}R.__boundDepthTexture=u}if(B.depthTexture&&!R.__autoAllocateDepthBuffer){if(v)throw new Error("target.depthTexture not supported in Cube render targets");let u=B.texture.mipmaps;if(u&&u.length>0)SJ(R.__webglFramebuffer[0],B);else SJ(R.__webglFramebuffer,B)}else if(v){R.__webglDepthbuffer=[];for(let u=0;u<6;u++)if($.bindFramebuffer(J.FRAMEBUFFER,R.__webglFramebuffer[u]),R.__webglDepthbuffer[u]===void 0)R.__webglDepthbuffer[u]=J.createRenderbuffer(),TJ(R.__webglDepthbuffer[u],B,!1);else{let i=B.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT,p=R.__webglDepthbuffer[u];J.bindRenderbuffer(J.RENDERBUFFER,p),J.framebufferRenderbuffer(J.FRAMEBUFFER,i,J.RENDERBUFFER,p)}}else{let u=B.texture.mipmaps;if(u&&u.length>0)$.bindFramebuffer(J.FRAMEBUFFER,R.__webglFramebuffer[0]);else $.bindFramebuffer(J.FRAMEBUFFER,R.__webglFramebuffer);if(R.__webglDepthbuffer===void 0)R.__webglDepthbuffer=J.createRenderbuffer(),TJ(R.__webglDepthbuffer,B,!1);else{let i=B.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT,p=R.__webglDepthbuffer;J.bindRenderbuffer(J.RENDERBUFFER,p),J.framebufferRenderbuffer(J.FRAMEBUFFER,i,J.RENDERBUFFER,p)}}$.bindFramebuffer(J.FRAMEBUFFER,null)}function _(B,R,v){let u=Z.get(B);if(R!==void 0)MJ(u.__webglFramebuffer,B,B.texture,J.COLOR_ATTACHMENT0,J.TEXTURE_2D,0);if(v!==void 0)E0(B)}function eJ(B){let R=B.texture,v=Z.get(B),u=Z.get(R);B.addEventListener("dispose",A);let i=B.textures,p=B.isWebGLCubeRenderTarget===!0,NJ=i.length>1;if(!NJ){if(u.__webglTexture===void 0)u.__webglTexture=J.createTexture();u.__version=R.version,H.memory.textures++}if(p){v.__webglFramebuffer=[];for(let JJ=0;JJ<6;JJ++)if(R.mipmaps&&R.mipmaps.length>0){v.__webglFramebuffer[JJ]=[];for(let FJ=0;FJ<R.mipmaps.length;FJ++)v.__webglFramebuffer[JJ][FJ]=J.createFramebuffer()}else v.__webglFramebuffer[JJ]=J.createFramebuffer()}else{if(R.mipmaps&&R.mipmaps.length>0){v.__webglFramebuffer=[];for(let JJ=0;JJ<R.mipmaps.length;JJ++)v.__webglFramebuffer[JJ]=J.createFramebuffer()}else v.__webglFramebuffer=J.createFramebuffer();if(NJ)for(let JJ=0,FJ=i.length;JJ<FJ;JJ++){let CJ=Z.get(i[JJ]);if(CJ.__webglTexture===void 0)CJ.__webglTexture=J.createTexture(),H.memory.textures++}if(B.samples>0&&IJ(B)===!1){v.__webglMultisampledFramebuffer=J.createFramebuffer(),v.__webglColorRenderbuffer=[],$.bindFramebuffer(J.FRAMEBUFFER,v.__webglMultisampledFramebuffer);for(let JJ=0;JJ<i.length;JJ++){let FJ=i[JJ];v.__webglColorRenderbuffer[JJ]=J.createRenderbuffer(),J.bindRenderbuffer(J.RENDERBUFFER,v.__webglColorRenderbuffer[JJ]);let CJ=K.convert(FJ.format,FJ.colorSpace),e=K.convert(FJ.type),XJ=V(FJ.internalFormat,CJ,e,FJ.colorSpace,B.isXRRenderTarget===!0),kJ=LJ(B);J.renderbufferStorageMultisample(J.RENDERBUFFER,kJ,XJ,B.width,B.height),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+JJ,J.RENDERBUFFER,v.__webglColorRenderbuffer[JJ])}if(J.bindRenderbuffer(J.RENDERBUFFER,null),B.depthBuffer)v.__webglDepthRenderbuffer=J.createRenderbuffer(),TJ(v.__webglDepthRenderbuffer,B,!0);$.bindFramebuffer(J.FRAMEBUFFER,null)}}if(p){$.bindTexture(J.TEXTURE_CUBE_MAP,u.__webglTexture),xJ(J.TEXTURE_CUBE_MAP,R);for(let JJ=0;JJ<6;JJ++)if(R.mipmaps&&R.mipmaps.length>0)for(let FJ=0;FJ<R.mipmaps.length;FJ++)MJ(v.__webglFramebuffer[JJ][FJ],B,R,J.COLOR_ATTACHMENT0,J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,FJ);else MJ(v.__webglFramebuffer[JJ],B,R,J.COLOR_ATTACHMENT0,J.TEXTURE_CUBE_MAP_POSITIVE_X+JJ,0);if(q(R))D(J.TEXTURE_CUBE_MAP);$.unbindTexture()}else if(NJ){for(let JJ=0,FJ=i.length;JJ<FJ;JJ++){let CJ=i[JJ],e=Z.get(CJ),XJ=J.TEXTURE_2D;if(B.isWebGL3DRenderTarget||B.isWebGLArrayRenderTarget)XJ=B.isWebGL3DRenderTarget?J.TEXTURE_3D:J.TEXTURE_2D_ARRAY;if($.bindTexture(XJ,e.__webglTexture),xJ(XJ,CJ),MJ(v.__webglFramebuffer,B,CJ,J.COLOR_ATTACHMENT0+JJ,XJ,0),q(CJ))D(XJ)}$.unbindTexture()}else{let JJ=J.TEXTURE_2D;if(B.isWebGL3DRenderTarget||B.isWebGLArrayRenderTarget)JJ=B.isWebGL3DRenderTarget?J.TEXTURE_3D:J.TEXTURE_2D_ARRAY;if($.bindTexture(JJ,u.__webglTexture),xJ(JJ,R),R.mipmaps&&R.mipmaps.length>0)for(let FJ=0;FJ<R.mipmaps.length;FJ++)MJ(v.__webglFramebuffer[FJ],B,R,J.COLOR_ATTACHMENT0,JJ,FJ);else MJ(v.__webglFramebuffer,B,R,J.COLOR_ATTACHMENT0,JJ,0);if(q(R))D(JJ);$.unbindTexture()}if(B.depthBuffer)E0(B)}function yJ(B){let R=B.textures;for(let v=0,u=R.length;v<u;v++){let i=R[v];if(q(i)){let p=P(B),NJ=Z.get(i).__webglTexture;$.bindTexture(p,NJ),D(p),$.unbindTexture()}}}let AJ=[],RJ=[];function J0(B){if(B.samples>0){if(IJ(B)===!1){let{textures:R,width:v,height:u}=B,i=J.COLOR_BUFFER_BIT,p=B.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT,NJ=Z.get(B),JJ=R.length>1;if(JJ)for(let CJ=0;CJ<R.length;CJ++)$.bindFramebuffer(J.FRAMEBUFFER,NJ.__webglMultisampledFramebuffer),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+CJ,J.RENDERBUFFER,null),$.bindFramebuffer(J.FRAMEBUFFER,NJ.__webglFramebuffer),J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0+CJ,J.TEXTURE_2D,null,0);$.bindFramebuffer(J.READ_FRAMEBUFFER,NJ.__webglMultisampledFramebuffer);let FJ=B.texture.mipmaps;if(FJ&&FJ.length>0)$.bindFramebuffer(J.DRAW_FRAMEBUFFER,NJ.__webglFramebuffer[0]);else $.bindFramebuffer(J.DRAW_FRAMEBUFFER,NJ.__webglFramebuffer);for(let CJ=0;CJ<R.length;CJ++){if(B.resolveDepthBuffer){if(B.depthBuffer)i|=J.DEPTH_BUFFER_BIT;if(B.stencilBuffer&&B.resolveStencilBuffer)i|=J.STENCIL_BUFFER_BIT}if(JJ){J.framebufferRenderbuffer(J.READ_FRAMEBUFFER,J.COLOR_ATTACHMENT0,J.RENDERBUFFER,NJ.__webglColorRenderbuffer[CJ]);let e=Z.get(R[CJ]).__webglTexture;J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0,J.TEXTURE_2D,e,0)}if(J.blitFramebuffer(0,0,v,u,0,0,v,u,i,J.NEAREST),X===!0){if(AJ.length=0,RJ.length=0,AJ.push(J.COLOR_ATTACHMENT0+CJ),B.depthBuffer&&B.resolveDepthBuffer===!1)AJ.push(p),RJ.push(p),J.invalidateFramebuffer(J.DRAW_FRAMEBUFFER,RJ);J.invalidateFramebuffer(J.READ_FRAMEBUFFER,AJ)}}if($.bindFramebuffer(J.READ_FRAMEBUFFER,null),$.bindFramebuffer(J.DRAW_FRAMEBUFFER,null),JJ)for(let CJ=0;CJ<R.length;CJ++){$.bindFramebuffer(J.FRAMEBUFFER,NJ.__webglMultisampledFramebuffer),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+CJ,J.RENDERBUFFER,NJ.__webglColorRenderbuffer[CJ]);let e=Z.get(R[CJ]).__webglTexture;$.bindFramebuffer(J.FRAMEBUFFER,NJ.__webglFramebuffer),J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0+CJ,J.TEXTURE_2D,e,0)}$.bindFramebuffer(J.DRAW_FRAMEBUFFER,NJ.__webglMultisampledFramebuffer)}else if(B.depthBuffer&&B.resolveDepthBuffer===!1&&X){let R=B.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT;J.invalidateFramebuffer(J.DRAW_FRAMEBUFFER,[R])}}}function LJ(B){return Math.min(W.maxSamples,B.samples)}function IJ(B){let R=Z.get(B);return B.samples>0&&Q.has("WEBGL_multisampled_render_to_texture")===!0&&R.__useRenderToTexture!==!1}function O0(B){let R=H.render.frame;if(E.get(B)!==R)E.set(B,R),B.update()}function N0(B,R){let{colorSpace:v,format:u,type:i}=B;if(B.isCompressedTexture===!0||B.isVideoTexture===!0)return R;if(v!==y9&&v!==T8)if(pJ.getTransfer(v)===rJ){if(u!==a0||i!==O8)console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.")}else console.error("THREE.WebGLTextures: Unsupported texture color space:",v);return R}function H0(B){if(typeof HTMLImageElement!=="undefined"&&B instanceof HTMLImageElement)U.width=B.naturalWidth||B.width,U.height=B.naturalHeight||B.height;else if(typeof VideoFrame!=="undefined"&&B instanceof VideoFrame)U.width=B.displayWidth,U.height=B.displayHeight;else U.width=B.width,U.height=B.height;return U}this.allocateTextureUnit=c,this.resetTextureUnits=d,this.setTexture2D=o,this.setTexture2DArray=l,this.setTexture3D=r,this.setTextureCube=g,this.rebindTextures=_,this.setupRenderTarget=eJ,this.updateRenderTargetMipmap=yJ,this.updateMultisampleRenderTarget=J0,this.setupDepthRenderbuffer=E0,this.setupFrameBufferTexture=MJ,this.useMultisampledRTT=IJ}function bU(J,Q){function $(Z,W=T8){let K,H=pJ.getTransfer(W);if(Z===O8)return J.UNSIGNED_BYTE;if(Z===S7)return J.UNSIGNED_SHORT_4_4_4_4;if(Z===j7)return J.UNSIGNED_SHORT_5_5_5_1;if(Z===MZ)return J.UNSIGNED_INT_5_9_9_9_REV;if(Z===kZ)return J.UNSIGNED_INT_10F_11F_11F_REV;if(Z===RZ)return J.BYTE;if(Z===FZ)return J.SHORT;if(Z===T9)return J.UNSIGNED_SHORT;if(Z===T7)return J.INT;if(Z===G9)return J.UNSIGNED_INT;if(Z===R8)return J.FLOAT;if(Z===S9)return J.HALF_FLOAT;if(Z===VZ)return J.ALPHA;if(Z===LZ)return J.RGB;if(Z===a0)return J.RGBA;if(Z===w6)return J.DEPTH_COMPONENT;if(Z===j9)return J.DEPTH_STENCIL;if(Z===zZ)return J.RED;if(Z===y7)return J.RED_INTEGER;if(Z===BZ)return J.RG;if(Z===v7)return J.RG_INTEGER;if(Z===f7)return J.RGBA_INTEGER;if(Z===P6||Z===A6||Z===T6||Z===S6)if(H===rJ)if(K=Q.get("WEBGL_compressed_texture_s3tc_srgb"),K!==null){if(Z===P6)return K.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(Z===A6)return K.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(Z===T6)return K.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(Z===S6)return K.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(K=Q.get("WEBGL_compressed_texture_s3tc"),K!==null){if(Z===P6)return K.COMPRESSED_RGB_S3TC_DXT1_EXT;if(Z===A6)return K.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(Z===T6)return K.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(Z===S6)return K.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(Z===b7||Z===h7||Z===x7||Z===g7)if(K=Q.get("WEBGL_compressed_texture_pvrtc"),K!==null){if(Z===b7)return K.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(Z===h7)return K.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(Z===x7)return K.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(Z===g7)return K.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(Z===p7||Z===m7||Z===d7)if(K=Q.get("WEBGL_compressed_texture_etc"),K!==null){if(Z===p7||Z===m7)return H===rJ?K.COMPRESSED_SRGB8_ETC2:K.COMPRESSED_RGB8_ETC2;if(Z===d7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:K.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(Z===l7||Z===u7||Z===c7||Z===n7||Z===s7||Z===i7||Z===o7||Z===a7||Z===r7||Z===t7||Z===e7||Z===JQ||Z===QQ||Z===$Q)if(K=Q.get("WEBGL_compressed_texture_astc"),K!==null){if(Z===l7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:K.COMPRESSED_RGBA_ASTC_4x4_KHR;if(Z===u7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:K.COMPRESSED_RGBA_ASTC_5x4_KHR;if(Z===c7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:K.COMPRESSED_RGBA_ASTC_5x5_KHR;if(Z===n7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:K.COMPRESSED_RGBA_ASTC_6x5_KHR;if(Z===s7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:K.COMPRESSED_RGBA_ASTC_6x6_KHR;if(Z===i7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:K.COMPRESSED_RGBA_ASTC_8x5_KHR;if(Z===o7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:K.COMPRESSED_RGBA_ASTC_8x6_KHR;if(Z===a7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:K.COMPRESSED_RGBA_ASTC_8x8_KHR;if(Z===r7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:K.COMPRESSED_RGBA_ASTC_10x5_KHR;if(Z===t7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:K.COMPRESSED_RGBA_ASTC_10x6_KHR;if(Z===e7)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:K.COMPRESSED_RGBA_ASTC_10x8_KHR;if(Z===JQ)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:K.COMPRESSED_RGBA_ASTC_10x10_KHR;if(Z===QQ)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:K.COMPRESSED_RGBA_ASTC_12x10_KHR;if(Z===$Q)return H===rJ?K.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:K.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(Z===ZQ||Z===WQ||Z===KQ)if(K=Q.get("EXT_texture_compression_bptc"),K!==null){if(Z===ZQ)return H===rJ?K.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:K.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(Z===WQ)return K.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(Z===KQ)return K.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(Z===YQ||Z===HQ||Z===XQ||Z===UQ)if(K=Q.get("EXT_texture_compression_rgtc"),K!==null){if(Z===YQ)return K.COMPRESSED_RED_RGTC1_EXT;if(Z===HQ)return K.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(Z===XQ)return K.COMPRESSED_RED_GREEN_RGTC2_EXT;if(Z===UQ)return K.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;if(Z===E9)return J.UNSIGNED_INT_24_8;return J[Z]!==void 0?J[Z]:null}return{convert:$}}var hU=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,xU=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class VW{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(J,Q){if(this.texture===null){let $=new u6(J.texture);if(J.depthNear!==Q.depthNear||J.depthFar!==Q.depthFar)this.depthNear=J.depthNear,this.depthFar=J.depthFar;this.texture=$}}getMesh(J){if(this.texture!==null){if(this.mesh===null){let Q=J.cameras[0].viewport,$=new j0({vertexShader:hU,fragmentShader:xU,uniforms:{depthColor:{value:this.texture},depthWidth:{value:Q.z},depthHeight:{value:Q.w}}});this.mesh=new l0(new x9(20,20),$)}}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class LW extends F8{constructor(J,Q){super();let $=this,Z=null,W=1,K=null,H="local-floor",Y=1,X=null,U=null,E=null,G=null,N=null,O=null,M=typeof XRWebGLBinding!=="undefined",k=new VW,q={},D=Q.getContextAttributes(),P=null,V=null,I=[],S=[],C=new cJ,A=null,x=new L0;x.viewport=new K0;let z=new L0;z.viewport=new K0;let L=[x,z],T=new bQ,d=null,c=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(n){let WJ=I[n];if(WJ===void 0)WJ=new h9,I[n]=WJ;return WJ.getTargetRaySpace()},this.getControllerGrip=function(n){let WJ=I[n];if(WJ===void 0)WJ=new h9,I[n]=WJ;return WJ.getGripSpace()},this.getHand=function(n){let WJ=I[n];if(WJ===void 0)WJ=new h9,I[n]=WJ;return WJ.getHandSpace()};function m(n){let WJ=S.indexOf(n.inputSource);if(WJ===-1)return;let QJ=I[WJ];if(QJ!==void 0)QJ.update(n.inputSource,n.frame,X||K),QJ.dispatchEvent({type:n.type,data:n.inputSource})}function o(){Z.removeEventListener("select",m),Z.removeEventListener("selectstart",m),Z.removeEventListener("selectend",m),Z.removeEventListener("squeeze",m),Z.removeEventListener("squeezestart",m),Z.removeEventListener("squeezeend",m),Z.removeEventListener("end",o),Z.removeEventListener("inputsourceschange",l);for(let n=0;n<I.length;n++){let WJ=S[n];if(WJ===null)continue;S[n]=null,I[n].disconnect(WJ)}d=null,c=null,k.reset();for(let n in q)delete q[n];J.setRenderTarget(P),N=null,G=null,E=null,Z=null,V=null,mJ.stop(),$.isPresenting=!1,J.setPixelRatio(A),J.setSize(C.width,C.height,!1),$.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(n){if(W=n,$.isPresenting===!0)console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(n){if(H=n,$.isPresenting===!0)console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return X||K},this.setReferenceSpace=function(n){X=n},this.getBaseLayer=function(){return G!==null?G:N},this.getBinding=function(){if(E===null&&M)E=new XRWebGLBinding(Z,Q);return E},this.getFrame=function(){return O},this.getSession=function(){return Z},this.setSession=async function(n){if(Z=n,Z!==null){if(P=J.getRenderTarget(),Z.addEventListener("select",m),Z.addEventListener("selectstart",m),Z.addEventListener("selectend",m),Z.addEventListener("squeeze",m),Z.addEventListener("squeezestart",m),Z.addEventListener("squeezeend",m),Z.addEventListener("end",o),Z.addEventListener("inputsourceschange",l),D.xrCompatible!==!0)await Q.makeXRCompatible();if(A=J.getPixelRatio(),J.getSize(C),!(M&&("createProjectionLayer"in XRWebGLBinding.prototype))){let QJ={antialias:D.antialias,alpha:!0,depth:D.depth,stencil:D.stencil,framebufferScaleFactor:W};N=new XRWebGLLayer(Z,Q,QJ),Z.updateRenderState({baseLayer:N}),J.setPixelRatio(1),J.setSize(N.framebufferWidth,N.framebufferHeight,!1),V=new Y8(N.framebufferWidth,N.framebufferHeight,{format:a0,type:O8,colorSpace:J.outputColorSpace,stencilBuffer:D.stencil,resolveDepthBuffer:N.ignoreDepthValues===!1,resolveStencilBuffer:N.ignoreDepthValues===!1})}else{let QJ=null,MJ=null,TJ=null;if(D.depth)TJ=D.stencil?Q.DEPTH24_STENCIL8:Q.DEPTH_COMPONENT24,QJ=D.stencil?j9:w6,MJ=D.stencil?E9:G9;let SJ={colorFormat:Q.RGBA8,depthFormat:TJ,scaleFactor:W};E=this.getBinding(),G=E.createProjectionLayer(SJ),Z.updateRenderState({layers:[G]}),J.setPixelRatio(1),J.setSize(G.textureWidth,G.textureHeight,!1),V=new Y8(G.textureWidth,G.textureHeight,{format:a0,type:O8,depthTexture:new l6(G.textureWidth,G.textureHeight,MJ,void 0,void 0,void 0,void 0,void 0,void 0,QJ),stencilBuffer:D.stencil,colorSpace:J.outputColorSpace,samples:D.antialias?4:0,resolveDepthBuffer:G.ignoreDepthValues===!1,resolveStencilBuffer:G.ignoreDepthValues===!1})}V.isXRRenderTarget=!0,this.setFoveation(Y),X=null,K=await Z.requestReferenceSpace(H),mJ.setContext(Z),mJ.start(),$.isPresenting=!0,$.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(Z!==null)return Z.environmentBlendMode},this.getDepthTexture=function(){return k.getDepthTexture()};function l(n){for(let WJ=0;WJ<n.removed.length;WJ++){let QJ=n.removed[WJ],MJ=S.indexOf(QJ);if(MJ>=0)S[MJ]=null,I[MJ].disconnect(QJ)}for(let WJ=0;WJ<n.added.length;WJ++){let QJ=n.added[WJ],MJ=S.indexOf(QJ);if(MJ===-1){for(let SJ=0;SJ<I.length;SJ++)if(SJ>=S.length){S.push(QJ),MJ=SJ;break}else if(S[SJ]===null){S[SJ]=QJ,MJ=SJ;break}if(MJ===-1)break}let TJ=I[MJ];if(TJ)TJ.connect(QJ)}}let r=new f,g=new f;function KJ(n,WJ,QJ){r.setFromMatrixPosition(WJ.matrixWorld),g.setFromMatrixPosition(QJ.matrixWorld);let MJ=r.distanceTo(g),TJ=WJ.projectionMatrix.elements,SJ=QJ.projectionMatrix.elements,E0=TJ[14]/(TJ[10]-1),_=TJ[14]/(TJ[10]+1),eJ=(TJ[9]+1)/TJ[5],yJ=(TJ[9]-1)/TJ[5],AJ=(TJ[8]-1)/TJ[0],RJ=(SJ[8]+1)/SJ[0],J0=E0*AJ,LJ=E0*RJ,IJ=MJ/(-AJ+RJ),O0=IJ*-AJ;if(WJ.matrixWorld.decompose(n.position,n.quaternion,n.scale),n.translateX(O0),n.translateZ(IJ),n.matrixWorld.compose(n.position,n.quaternion,n.scale),n.matrixWorldInverse.copy(n.matrixWorld).invert(),TJ[10]===-1)n.projectionMatrix.copy(WJ.projectionMatrix),n.projectionMatrixInverse.copy(WJ.projectionMatrixInverse);else{let N0=E0+IJ,H0=_+IJ,B=J0-O0,R=LJ+(MJ-O0),v=eJ*_/H0*N0,u=yJ*_/H0*N0;n.projectionMatrix.makePerspective(B,R,v,u,N0,H0),n.projectionMatrixInverse.copy(n.projectionMatrix).invert()}}function GJ(n,WJ){if(WJ===null)n.matrixWorld.copy(n.matrix);else n.matrixWorld.multiplyMatrices(WJ.matrixWorld,n.matrix);n.matrixWorldInverse.copy(n.matrixWorld).invert()}this.updateCamera=function(n){if(Z===null)return;let{near:WJ,far:QJ}=n;if(k.texture!==null){if(k.depthNear>0)WJ=k.depthNear;if(k.depthFar>0)QJ=k.depthFar}if(T.near=z.near=x.near=WJ,T.far=z.far=x.far=QJ,d!==T.near||c!==T.far)Z.updateRenderState({depthNear:T.near,depthFar:T.far}),d=T.near,c=T.far;T.layers.mask=n.layers.mask|6,x.layers.mask=T.layers.mask&3,z.layers.mask=T.layers.mask&5;let MJ=n.parent,TJ=T.cameras;GJ(T,MJ);for(let SJ=0;SJ<TJ.length;SJ++)GJ(TJ[SJ],MJ);if(TJ.length===2)KJ(T,x,z);else T.projectionMatrix.copy(x.projectionMatrix);PJ(n,T,MJ)};function PJ(n,WJ,QJ){if(QJ===null)n.matrix.copy(WJ.matrixWorld);else n.matrix.copy(QJ.matrixWorld),n.matrix.invert(),n.matrix.multiply(WJ.matrixWorld);if(n.matrix.decompose(n.position,n.quaternion,n.scale),n.updateMatrixWorld(!0),n.projectionMatrix.copy(WJ.projectionMatrix),n.projectionMatrixInverse.copy(WJ.projectionMatrixInverse),n.isPerspectiveCamera)n.fov=D6*2*Math.atan(1/n.projectionMatrix.elements[5]),n.zoom=1}this.getCamera=function(){return T},this.getFoveation=function(){if(G===null&&N===null)return;return Y},this.setFoveation=function(n){if(Y=n,G!==null)G.fixedFoveation=n;if(N!==null&&N.fixedFoveation!==void 0)N.fixedFoveation=n},this.hasDepthSensing=function(){return k.texture!==null},this.getDepthSensingMesh=function(){return k.getMesh(T)},this.getCameraTexture=function(n){return q[n]};let xJ=null;function Y0(n,WJ){if(U=WJ.getViewerPose(X||K),O=WJ,U!==null){let QJ=U.views;if(N!==null)J.setRenderTargetFramebuffer(V,N.framebuffer),J.setRenderTarget(V);let MJ=!1;if(QJ.length!==T.cameras.length)T.cameras.length=0,MJ=!0;for(let _=0;_<QJ.length;_++){let eJ=QJ[_],yJ=null;if(N!==null)yJ=N.getViewport(eJ);else{let RJ=E.getViewSubImage(G,eJ);if(yJ=RJ.viewport,_===0)J.setRenderTargetTextures(V,RJ.colorTexture,RJ.depthStencilTexture),J.setRenderTarget(V)}let AJ=L[_];if(AJ===void 0)AJ=new L0,AJ.layers.enable(_),AJ.viewport=new K0,L[_]=AJ;if(AJ.matrix.fromArray(eJ.transform.matrix),AJ.matrix.decompose(AJ.position,AJ.quaternion,AJ.scale),AJ.projectionMatrix.fromArray(eJ.projectionMatrix),AJ.projectionMatrixInverse.copy(AJ.projectionMatrix).invert(),AJ.viewport.set(yJ.x,yJ.y,yJ.width,yJ.height),_===0)T.matrix.copy(AJ.matrix),T.matrix.decompose(T.position,T.quaternion,T.scale);if(MJ===!0)T.cameras.push(AJ)}let TJ=Z.enabledFeatures;if(TJ&&TJ.includes("depth-sensing")&&Z.depthUsage=="gpu-optimized"&&M){E=$.getBinding();let _=E.getDepthInformation(QJ[0]);if(_&&_.isValid&&_.texture)k.init(_,Z.renderState)}if(TJ&&TJ.includes("camera-access")&&M){J.state.unbindTexture(),E=$.getBinding();for(let _=0;_<QJ.length;_++){let eJ=QJ[_].camera;if(eJ){let yJ=q[eJ];if(!yJ)yJ=new u6,q[eJ]=yJ;let AJ=E.getCameraImage(eJ);yJ.sourceTexture=AJ}}}}for(let QJ=0;QJ<I.length;QJ++){let MJ=S[QJ],TJ=I[QJ];if(MJ!==null&&TJ!==void 0)TJ.update(MJ,WJ,X||K)}if(xJ)xJ(n,WJ);if(WJ.detectedPlanes)$.dispatchEvent({type:"planesdetected",data:WJ});O=null}let mJ=new GW;mJ.setAnimationLoop(Y0),this.setAnimationLoop=function(n){xJ=n},this.dispose=function(){}}}var x8=new s0,gU=new W0;function pU(J,Q){function $(q,D){if(q.matrixAutoUpdate===!0)q.updateMatrix();D.value.copy(q.matrix)}function Z(q,D){if(D.color.getRGB(q.fogColor.value,MQ(J)),D.isFog)q.fogNear.value=D.near,q.fogFar.value=D.far;else if(D.isFogExp2)q.fogDensity.value=D.density}function W(q,D,P,V,I){if(D.isMeshBasicMaterial)K(q,D);else if(D.isMeshLambertMaterial)K(q,D);else if(D.isMeshToonMaterial)K(q,D),G(q,D);else if(D.isMeshPhongMaterial)K(q,D),E(q,D);else if(D.isMeshStandardMaterial){if(K(q,D),N(q,D),D.isMeshPhysicalMaterial)O(q,D,I)}else if(D.isMeshMatcapMaterial)K(q,D),M(q,D);else if(D.isMeshDepthMaterial)K(q,D);else if(D.isMeshDistanceMaterial)K(q,D),k(q,D);else if(D.isMeshNormalMaterial)K(q,D);else if(D.isLineBasicMaterial){if(H(q,D),D.isLineDashedMaterial)Y(q,D)}else if(D.isPointsMaterial)X(q,D,P,V);else if(D.isSpriteMaterial)U(q,D);else if(D.isShadowMaterial)q.color.value.copy(D.color),q.opacity.value=D.opacity;else if(D.isShaderMaterial)D.uniformsNeedUpdate=!1}function K(q,D){if(q.opacity.value=D.opacity,D.color)q.diffuse.value.copy(D.color);if(D.emissive)q.emissive.value.copy(D.emissive).multiplyScalar(D.emissiveIntensity);if(D.map)q.map.value=D.map,$(D.map,q.mapTransform);if(D.alphaMap)q.alphaMap.value=D.alphaMap,$(D.alphaMap,q.alphaMapTransform);if(D.bumpMap){if(q.bumpMap.value=D.bumpMap,$(D.bumpMap,q.bumpMapTransform),q.bumpScale.value=D.bumpScale,D.side===T0)q.bumpScale.value*=-1}if(D.normalMap){if(q.normalMap.value=D.normalMap,$(D.normalMap,q.normalMapTransform),q.normalScale.value.copy(D.normalScale),D.side===T0)q.normalScale.value.negate()}if(D.displacementMap)q.displacementMap.value=D.displacementMap,$(D.displacementMap,q.displacementMapTransform),q.displacementScale.value=D.displacementScale,q.displacementBias.value=D.displacementBias;if(D.emissiveMap)q.emissiveMap.value=D.emissiveMap,$(D.emissiveMap,q.emissiveMapTransform);if(D.specularMap)q.specularMap.value=D.specularMap,$(D.specularMap,q.specularMapTransform);if(D.alphaTest>0)q.alphaTest.value=D.alphaTest;let P=Q.get(D),V=P.envMap,I=P.envMapRotation;if(V){if(q.envMap.value=V,x8.copy(I),x8.x*=-1,x8.y*=-1,x8.z*=-1,V.isCubeTexture&&V.isRenderTargetTexture===!1)x8.y*=-1,x8.z*=-1;q.envMapRotation.value.setFromMatrix4(gU.makeRotationFromEuler(x8)),q.flipEnvMap.value=V.isCubeTexture&&V.isRenderTargetTexture===!1?-1:1,q.reflectivity.value=D.reflectivity,q.ior.value=D.ior,q.refractionRatio.value=D.refractionRatio}if(D.lightMap)q.lightMap.value=D.lightMap,q.lightMapIntensity.value=D.lightMapIntensity,$(D.lightMap,q.lightMapTransform);if(D.aoMap)q.aoMap.value=D.aoMap,q.aoMapIntensity.value=D.aoMapIntensity,$(D.aoMap,q.aoMapTransform)}function H(q,D){if(q.diffuse.value.copy(D.color),q.opacity.value=D.opacity,D.map)q.map.value=D.map,$(D.map,q.mapTransform)}function Y(q,D){q.dashSize.value=D.dashSize,q.totalSize.value=D.dashSize+D.gapSize,q.scale.value=D.scale}function X(q,D,P,V){if(q.diffuse.value.copy(D.color),q.opacity.value=D.opacity,q.size.value=D.size*P,q.scale.value=V*0.5,D.map)q.map.value=D.map,$(D.map,q.uvTransform);if(D.alphaMap)q.alphaMap.value=D.alphaMap,$(D.alphaMap,q.alphaMapTransform);if(D.alphaTest>0)q.alphaTest.value=D.alphaTest}function U(q,D){if(q.diffuse.value.copy(D.color),q.opacity.value=D.opacity,q.rotation.value=D.rotation,D.map)q.map.value=D.map,$(D.map,q.mapTransform);if(D.alphaMap)q.alphaMap.value=D.alphaMap,$(D.alphaMap,q.alphaMapTransform);if(D.alphaTest>0)q.alphaTest.value=D.alphaTest}function E(q,D){q.specular.value.copy(D.specular),q.shininess.value=Math.max(D.shininess,0.0001)}function G(q,D){if(D.gradientMap)q.gradientMap.value=D.gradientMap}function N(q,D){if(q.metalness.value=D.metalness,D.metalnessMap)q.metalnessMap.value=D.metalnessMap,$(D.metalnessMap,q.metalnessMapTransform);if(q.roughness.value=D.roughness,D.roughnessMap)q.roughnessMap.value=D.roughnessMap,$(D.roughnessMap,q.roughnessMapTransform);if(D.envMap)q.envMapIntensity.value=D.envMapIntensity}function O(q,D,P){if(q.ior.value=D.ior,D.sheen>0){if(q.sheenColor.value.copy(D.sheenColor).multiplyScalar(D.sheen),q.sheenRoughness.value=D.sheenRoughness,D.sheenColorMap)q.sheenColorMap.value=D.sheenColorMap,$(D.sheenColorMap,q.sheenColorMapTransform);if(D.sheenRoughnessMap)q.sheenRoughnessMap.value=D.sheenRoughnessMap,$(D.sheenRoughnessMap,q.sheenRoughnessMapTransform)}if(D.clearcoat>0){if(q.clearcoat.value=D.clearcoat,q.clearcoatRoughness.value=D.clearcoatRoughness,D.clearcoatMap)q.clearcoatMap.value=D.clearcoatMap,$(D.clearcoatMap,q.clearcoatMapTransform);if(D.clearcoatRoughnessMap)q.clearcoatRoughnessMap.value=D.clearcoatRoughnessMap,$(D.clearcoatRoughnessMap,q.clearcoatRoughnessMapTransform);if(D.clearcoatNormalMap){if(q.clearcoatNormalMap.value=D.clearcoatNormalMap,$(D.clearcoatNormalMap,q.clearcoatNormalMapTransform),q.clearcoatNormalScale.value.copy(D.clearcoatNormalScale),D.side===T0)q.clearcoatNormalScale.value.negate()}}if(D.dispersion>0)q.dispersion.value=D.dispersion;if(D.iridescence>0){if(q.iridescence.value=D.iridescence,q.iridescenceIOR.value=D.iridescenceIOR,q.iridescenceThicknessMinimum.value=D.iridescenceThicknessRange[0],q.iridescenceThicknessMaximum.value=D.iridescenceThicknessRange[1],D.iridescenceMap)q.iridescenceMap.value=D.iridescenceMap,$(D.iridescenceMap,q.iridescenceMapTransform);if(D.iridescenceThicknessMap)q.iridescenceThicknessMap.value=D.iridescenceThicknessMap,$(D.iridescenceThicknessMap,q.iridescenceThicknessMapTransform)}if(D.transmission>0){if(q.transmission.value=D.transmission,q.transmissionSamplerMap.value=P.texture,q.transmissionSamplerSize.value.set(P.width,P.height),D.transmissionMap)q.transmissionMap.value=D.transmissionMap,$(D.transmissionMap,q.transmissionMapTransform);if(q.thickness.value=D.thickness,D.thicknessMap)q.thicknessMap.value=D.thicknessMap,$(D.thicknessMap,q.thicknessMapTransform);q.attenuationDistance.value=D.attenuationDistance,q.attenuationColor.value.copy(D.attenuationColor)}if(D.anisotropy>0){if(q.anisotropyVector.value.set(D.anisotropy*Math.cos(D.anisotropyRotation),D.anisotropy*Math.sin(D.anisotropyRotation)),D.anisotropyMap)q.anisotropyMap.value=D.anisotropyMap,$(D.anisotropyMap,q.anisotropyMapTransform)}if(q.specularIntensity.value=D.specularIntensity,q.specularColor.value.copy(D.specularColor),D.specularColorMap)q.specularColorMap.value=D.specularColorMap,$(D.specularColorMap,q.specularColorMapTransform);if(D.specularIntensityMap)q.specularIntensityMap.value=D.specularIntensityMap,$(D.specularIntensityMap,q.specularIntensityMapTransform)}function M(q,D){if(D.matcap)q.matcap.value=D.matcap}function k(q,D){let P=Q.get(D).light;q.referencePosition.value.setFromMatrixPosition(P.matrixWorld),q.nearDistance.value=P.shadow.camera.near,q.farDistance.value=P.shadow.camera.far}return{refreshFogUniforms:Z,refreshMaterialUniforms:W}}function mU(J,Q,$,Z){let W={},K={},H=[],Y=J.getParameter(J.MAX_UNIFORM_BUFFER_BINDINGS);function X(P,V){let I=V.program;Z.uniformBlockBinding(P,I)}function U(P,V){let I=W[P.id];if(I===void 0)M(P),I=E(P),W[P.id]=I,P.addEventListener("dispose",q);let S=V.program;Z.updateUBOMapping(P,S);let C=Q.render.frame;if(K[P.id]!==C)N(P),K[P.id]=C}function E(P){let V=G();P.__bindingPointIndex=V;let I=J.createBuffer(),S=P.__size,C=P.usage;return J.bindBuffer(J.UNIFORM_BUFFER,I),J.bufferData(J.UNIFORM_BUFFER,S,C),J.bindBuffer(J.UNIFORM_BUFFER,null),J.bindBufferBase(J.UNIFORM_BUFFER,V,I),I}function G(){for(let P=0;P<Y;P++)if(H.indexOf(P)===-1)return H.push(P),P;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function N(P){let V=W[P.id],I=P.uniforms,S=P.__cache;J.bindBuffer(J.UNIFORM_BUFFER,V);for(let C=0,A=I.length;C<A;C++){let x=Array.isArray(I[C])?I[C]:[I[C]];for(let z=0,L=x.length;z<L;z++){let T=x[z];if(O(T,C,z,S)===!0){let d=T.__offset,c=Array.isArray(T.value)?T.value:[T.value],m=0;for(let o=0;o<c.length;o++){let l=c[o],r=k(l);if(typeof l==="number"||typeof l==="boolean")T.__data[0]=l,J.bufferSubData(J.UNIFORM_BUFFER,d+m,T.__data);else if(l.isMatrix3)T.__data[0]=l.elements[0],T.__data[1]=l.elements[1],T.__data[2]=l.elements[2],T.__data[3]=0,T.__data[4]=l.elements[3],T.__data[5]=l.elements[4],T.__data[6]=l.elements[5],T.__data[7]=0,T.__data[8]=l.elements[6],T.__data[9]=l.elements[7],T.__data[10]=l.elements[8],T.__data[11]=0;else l.toArray(T.__data,m),m+=r.storage/Float32Array.BYTES_PER_ELEMENT}J.bufferSubData(J.UNIFORM_BUFFER,d,T.__data)}}}J.bindBuffer(J.UNIFORM_BUFFER,null)}function O(P,V,I,S){let C=P.value,A=V+"_"+I;if(S[A]===void 0){if(typeof C==="number"||typeof C==="boolean")S[A]=C;else S[A]=C.clone();return!0}else{let x=S[A];if(typeof C==="number"||typeof C==="boolean"){if(x!==C)return S[A]=C,!0}else if(x.equals(C)===!1)return x.copy(C),!0}return!1}function M(P){let V=P.uniforms,I=0,S=16;for(let A=0,x=V.length;A<x;A++){let z=Array.isArray(V[A])?V[A]:[V[A]];for(let L=0,T=z.length;L<T;L++){let d=z[L],c=Array.isArray(d.value)?d.value:[d.value];for(let m=0,o=c.length;m<o;m++){let l=c[m],r=k(l),g=I%S,KJ=g%r.boundary,GJ=g+KJ;if(I+=KJ,GJ!==0&&S-GJ<r.storage)I+=S-GJ;d.__data=new Float32Array(r.storage/Float32Array.BYTES_PER_ELEMENT),d.__offset=I,I+=r.storage}}}let C=I%S;if(C>0)I+=S-C;return P.__size=I,P.__cache={},this}function k(P){let V={boundary:0,storage:0};if(typeof P==="number"||typeof P==="boolean")V.boundary=4,V.storage=4;else if(P.isVector2)V.boundary=8,V.storage=8;else if(P.isVector3||P.isColor)V.boundary=16,V.storage=12;else if(P.isVector4)V.boundary=16,V.storage=16;else if(P.isMatrix3)V.boundary=48,V.storage=48;else if(P.isMatrix4)V.boundary=64,V.storage=64;else if(P.isTexture)console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group.");else console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",P);return V}function q(P){let V=P.target;V.removeEventListener("dispose",q);let I=H.indexOf(V.__bindingPointIndex);H.splice(I,1),J.deleteBuffer(W[V.id]),delete W[V.id],delete K[V.id]}function D(){for(let P in W)J.deleteBuffer(W[P]);H=[],W={},K={}}return{bind:X,update:U,dispose:D}}class oQ{constructor(J={}){let{canvas:Q=fZ(),context:$=null,depth:Z=!0,stencil:W=!1,alpha:K=!1,antialias:H=!1,premultipliedAlpha:Y=!0,preserveDrawingBuffer:X=!1,powerPreference:U="default",failIfMajorPerformanceCaveat:E=!1,reversedDepthBuffer:G=!1}=J;this.isWebGLRenderer=!0;let N;if($!==null){if(typeof WebGLRenderingContext!=="undefined"&&$ instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");N=$.getContextAttributes().alpha}else N=K;let O=new Uint32Array(4),M=new Int32Array(4),k=null,q=null,D=[],P=[];this.domElement=Q,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=K8,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let V=this,I=!1;this._outputColorSpace=wZ;let S=0,C=0,A=null,x=-1,z=null,L=new K0,T=new K0,d=null,c=new lJ(0),m=0,o=Q.width,l=Q.height,r=1,g=null,KJ=null,GJ=new K0(0,0,o,l),PJ=new K0(0,0,o,l),xJ=!1,Y0=new p6,mJ=!1,n=!1,WJ=new W0,QJ=new f,MJ=new K0,TJ={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},SJ=!1;function E0(){return A===null?r:1}let _=$;function eJ(F,j){return Q.getContext(F,j)}try{let F={alpha:!0,depth:Z,stencil:W,antialias:H,premultipliedAlpha:Y,preserveDrawingBuffer:X,powerPreference:U,failIfMajorPerformanceCaveat:E};if("setAttribute"in Q)Q.setAttribute("data-engine",`three.js r${j$}`);if(Q.addEventListener("webglcontextlost",YJ,!1),Q.addEventListener("webglcontextrestored",$J,!1),Q.addEventListener("webglcontextcreationerror",qJ,!1),_===null){if(_=eJ("webgl2",F),_===null)if(eJ("webgl2"))throw new Error("Error creating WebGL context with your selected attributes.");else throw new Error("Error creating WebGL context.")}}catch(F){throw console.error("THREE.WebGLRenderer: "+F.message),F}let yJ,AJ,RJ,J0,LJ,IJ,O0,N0,H0,B,R,v,u,i,p,NJ,JJ,FJ,CJ,e,XJ,kJ,VJ,UJ;function bJ(){if(yJ=new KX(_),yJ.init(),kJ=new bU(_,yJ),AJ=new tH(_,yJ,J,kJ),RJ=new vU(_,yJ),AJ.reversedDepthBuffer&&G)RJ.buffers.depth.setReversed(!0);J0=new XX(_),LJ=new LU,IJ=new fU(_,yJ,RJ,LJ,AJ,kJ,J0),O0=new JX(V),N0=new WX(V),H0=new DK(_),VJ=new aH(_,H0),B=new YX(_,H0,J0,VJ),R=new GX(_,B,H0,J0),CJ=new UX(_,AJ,IJ),NJ=new eH(LJ),v=new VU(V,O0,N0,yJ,AJ,VJ,NJ),u=new pU(V,LJ),i=new BU,p=new AU(yJ),FJ=new oH(V,O0,N0,RJ,R,N,Y),JJ=new jU(V,R,AJ),UJ=new mU(_,J0,AJ,RJ),e=new rH(_,yJ,J0),XJ=new HX(_,yJ,J0),J0.programs=v.programs,V.capabilities=AJ,V.extensions=yJ,V.properties=LJ,V.renderLists=i,V.shadowMap=JJ,V.state=RJ,V.info=J0}bJ();let w=new LW(V,_);this.xr=w,this.getContext=function(){return _},this.getContextAttributes=function(){return _.getContextAttributes()},this.forceContextLoss=function(){let F=yJ.get("WEBGL_lose_context");if(F)F.loseContext()},this.forceContextRestore=function(){let F=yJ.get("WEBGL_lose_context");if(F)F.restoreContext()},this.getPixelRatio=function(){return r},this.setPixelRatio=function(F){if(F===void 0)return;r=F,this.setSize(o,l,!1)},this.getSize=function(F){return F.set(o,l)},this.setSize=function(F,j,b=!0){if(w.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}if(o=F,l=j,Q.width=Math.floor(F*r),Q.height=Math.floor(j*r),b===!0)Q.style.width=F+"px",Q.style.height=j+"px";this.setViewport(0,0,F,j)},this.getDrawingBufferSize=function(F){return F.set(o*r,l*r).floor()},this.setDrawingBufferSize=function(F,j,b){o=F,l=j,r=b,Q.width=Math.floor(F*b),Q.height=Math.floor(j*b),this.setViewport(0,0,F,j)},this.getCurrentViewport=function(F){return F.copy(L)},this.getViewport=function(F){return F.copy(GJ)},this.setViewport=function(F,j,b,h){if(F.isVector4)GJ.set(F.x,F.y,F.z,F.w);else GJ.set(F,j,b,h);RJ.viewport(L.copy(GJ).multiplyScalar(r).round())},this.getScissor=function(F){return F.copy(PJ)},this.setScissor=function(F,j,b,h){if(F.isVector4)PJ.set(F.x,F.y,F.z,F.w);else PJ.set(F,j,b,h);RJ.scissor(T.copy(PJ).multiplyScalar(r).round())},this.getScissorTest=function(){return xJ},this.setScissorTest=function(F){RJ.setScissorTest(xJ=F)},this.setOpaqueSort=function(F){g=F},this.setTransparentSort=function(F){KJ=F},this.getClearColor=function(F){return F.copy(FJ.getClearColor())},this.setClearColor=function(){FJ.setClearColor(...arguments)},this.getClearAlpha=function(){return FJ.getClearAlpha()},this.setClearAlpha=function(){FJ.setClearAlpha(...arguments)},this.clear=function(F=!0,j=!0,b=!0){let h=0;if(F){let y=!1;if(A!==null){let t=A.texture.format;y=t===f7||t===v7||t===y7}if(y){let t=A.texture.type,HJ=t===O8||t===G9||t===T9||t===E9||t===S7||t===j7,DJ=FJ.getClearColor(),EJ=FJ.getClearAlpha(),_J=DJ.r,wJ=DJ.g,zJ=DJ.b;if(HJ)O[0]=_J,O[1]=wJ,O[2]=zJ,O[3]=EJ,_.clearBufferuiv(_.COLOR,0,O);else M[0]=_J,M[1]=wJ,M[2]=zJ,M[3]=EJ,_.clearBufferiv(_.COLOR,0,M)}else h|=_.COLOR_BUFFER_BIT}if(j)h|=_.DEPTH_BUFFER_BIT;if(b)h|=_.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295);_.clear(h)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){Q.removeEventListener("webglcontextlost",YJ,!1),Q.removeEventListener("webglcontextrestored",$J,!1),Q.removeEventListener("webglcontextcreationerror",qJ,!1),FJ.dispose(),i.dispose(),p.dispose(),LJ.dispose(),O0.dispose(),N0.dispose(),R.dispose(),VJ.dispose(),UJ.dispose(),v.dispose(),w.dispose(),w.removeEventListener("sessionstart",c0),w.removeEventListener("sessionend",n0),z8.stop()};function YJ(F){F.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),I=!0}function $J(){console.log("THREE.WebGLRenderer: Context Restored."),I=!1;let F=J0.autoReset,j=JJ.enabled,b=JJ.autoUpdate,h=JJ.needsUpdate,y=JJ.type;bJ(),J0.autoReset=F,JJ.enabled=j,JJ.autoUpdate=b,JJ.needsUpdate=h,JJ.type=y}function qJ(F){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",F.statusMessage)}function a(F){let j=F.target;j.removeEventListener("dispose",a),s(j)}function s(F){OJ(F),LJ.remove(F)}function OJ(F){let j=LJ.get(F).programs;if(j!==void 0){if(j.forEach(function(b){v.releaseProgram(b)}),F.isShaderMaterial)v.releaseShaderCache(F)}}this.renderBufferDirect=function(F,j,b,h,y,t){if(j===null)j=TJ;let HJ=y.isMesh&&y.matrixWorld.determinant()<0,DJ=TW(F,j,b,h,y);RJ.setMaterial(h,HJ);let EJ=b.index,_J=1;if(h.wireframe===!0){if(EJ=B.getWireframeAttribute(b),EJ===void 0)return;_J=2}let wJ=b.drawRange,zJ=b.attributes.position,hJ=wJ.start*_J,sJ=(wJ.start+wJ.count)*_J;if(t!==null)hJ=Math.max(hJ,t.start*_J),sJ=Math.min(sJ,(t.start+t.count)*_J);if(EJ!==null)hJ=Math.max(hJ,0),sJ=Math.min(sJ,EJ.count);else if(zJ!==void 0&&zJ!==null)hJ=Math.max(hJ,0),sJ=Math.min(sJ,zJ.count);let Z0=sJ-hJ;if(Z0<0||Z0===1/0)return;VJ.setup(y,h,DJ,b,EJ);let tJ,oJ=e;if(EJ!==null)tJ=H0.get(EJ),oJ=XJ,oJ.setIndex(tJ);if(y.isMesh)if(h.wireframe===!0)RJ.setLineWidth(h.wireframeLinewidth*E0()),oJ.setMode(_.LINES);else oJ.setMode(_.TRIANGLES);else if(y.isLine){let BJ=h.linewidth;if(BJ===void 0)BJ=1;if(RJ.setLineWidth(BJ*E0()),y.isLineSegments)oJ.setMode(_.LINES);else if(y.isLineLoop)oJ.setMode(_.LINE_LOOP);else oJ.setMode(_.LINE_STRIP)}else if(y.isPoints)oJ.setMode(_.POINTS);else if(y.isSprite)oJ.setMode(_.TRIANGLES);if(y.isBatchedMesh)if(y._multiDrawInstances!==null)Z9("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),oJ.renderMultiDrawInstances(y._multiDrawStarts,y._multiDrawCounts,y._multiDrawCount,y._multiDrawInstances);else if(!yJ.get("WEBGL_multi_draw")){let{_multiDrawStarts:BJ,_multiDrawCounts:Q0,_multiDrawCount:dJ}=y,C0=EJ?H0.get(EJ).bytesPerElement:1,l8=LJ.get(h).currentProgram.getUniforms();for(let w0=0;w0<dJ;w0++)l8.setValue(_,"_gl_DrawID",w0),oJ.render(BJ[w0]/C0,Q0[w0])}else oJ.renderMultiDraw(y._multiDrawStarts,y._multiDrawCounts,y._multiDrawCount);else if(y.isInstancedMesh)oJ.renderInstances(hJ,Z0,y.count);else if(b.isInstancedBufferGeometry){let BJ=b._maxInstanceCount!==void 0?b._maxInstanceCount:1/0,Q0=Math.min(b.instanceCount,BJ);oJ.renderInstances(hJ,Z0,Q0)}else oJ.render(hJ,Z0)};function jJ(F,j,b){if(F.transparent===!0&&F.side===o0&&F.forceSinglePass===!1)F.side=T0,F.needsUpdate=!0,c9(F,j,b),F.side=W9,F.needsUpdate=!0,c9(F,j,b),F.side=o0;else c9(F,j,b)}this.compile=function(F,j,b=null){if(b===null)b=F;if(q=p.get(b),q.init(j),P.push(q),b.traverseVisible(function(y){if(y.isLight&&y.layers.test(j.layers)){if(q.pushLight(y),y.castShadow)q.pushShadow(y)}}),F!==b)F.traverseVisible(function(y){if(y.isLight&&y.layers.test(j.layers)){if(q.pushLight(y),y.castShadow)q.pushShadow(y)}});q.setupLights();let h=new Set;return F.traverse(function(y){if(!(y.isMesh||y.isPoints||y.isLine||y.isSprite))return;let t=y.material;if(t)if(Array.isArray(t))for(let HJ=0;HJ<t.length;HJ++){let DJ=t[HJ];jJ(DJ,b,y),h.add(DJ)}else jJ(t,b,y),h.add(t)}),q=P.pop(),h},this.compileAsync=function(F,j,b=null){let h=this.compile(F,j,b);return new Promise((y)=>{function t(){if(h.forEach(function(HJ){if(LJ.get(HJ).currentProgram.isReady())h.delete(HJ)}),h.size===0){y(F);return}setTimeout(t,10)}if(yJ.get("KHR_parallel_shader_compile")!==null)t();else setTimeout(t,10)})};let iJ=null;function nJ(F){if(iJ)iJ(F)}function c0(){z8.stop()}function n0(){z8.start()}let z8=new GW;if(z8.setAnimationLoop(nJ),typeof self!=="undefined")z8.setContext(self);this.setAnimationLoop=function(F){iJ=F,w.setAnimationLoop(F),F===null?z8.stop():z8.start()},w.addEventListener("sessionstart",c0),w.addEventListener("sessionend",n0),this.render=function(F,j){if(j!==void 0&&j.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;if(F.matrixWorldAutoUpdate===!0)F.updateMatrixWorld();if(j.parent===null&&j.matrixWorldAutoUpdate===!0)j.updateMatrixWorld();if(w.enabled===!0&&w.isPresenting===!0){if(w.cameraAutoUpdate===!0)w.updateCamera(j);j=w.getCamera()}if(F.isScene===!0)F.onBeforeRender(V,F,j,A);if(q=p.get(F,P.length),q.init(j),P.push(q),WJ.multiplyMatrices(j.projectionMatrix,j.matrixWorldInverse),Y0.setFromProjectionMatrix(WJ,qQ,j.reversedDepth),n=this.localClippingEnabled,mJ=NJ.init(this.clippingPlanes,n),k=i.get(F,D.length),k.init(),D.push(k),w.enabled===!0&&w.isPresenting===!0){let t=V.xr.getDepthSensingMesh();if(t!==null)e6(t,j,-1/0,V.sortObjects)}if(e6(F,j,0,V.sortObjects),k.finish(),V.sortObjects===!0)k.sort(g,KJ);if(SJ=w.enabled===!1||w.isPresenting===!1||w.hasDepthSensing()===!1,SJ)FJ.addToRenderList(k,F);if(this.info.render.frame++,mJ===!0)NJ.beginShadows();let b=q.state.shadowsArray;if(JJ.render(b,F,j),mJ===!0)NJ.endShadows();if(this.info.autoReset===!0)this.info.reset();let{opaque:h,transmissive:y}=k;if(q.setupLights(),j.isArrayCamera){let t=j.cameras;if(y.length>0)for(let HJ=0,DJ=t.length;HJ<DJ;HJ++){let EJ=t[HJ];K$(h,y,F,EJ)}if(SJ)FJ.render(F);for(let HJ=0,DJ=t.length;HJ<DJ;HJ++){let EJ=t[HJ];W$(k,F,EJ,EJ.viewport)}}else{if(y.length>0)K$(h,y,F,j);if(SJ)FJ.render(F);W$(k,F,j)}if(A!==null&&C===0)IJ.updateMultisampleRenderTarget(A),IJ.updateRenderTargetMipmap(A);if(F.isScene===!0)F.onAfterRender(V,F,j);if(VJ.resetDefaultState(),x=-1,z=null,P.pop(),P.length>0){if(q=P[P.length-1],mJ===!0)NJ.setGlobalState(V.clippingPlanes,q.state.camera)}else q=null;if(D.pop(),D.length>0)k=D[D.length-1];else k=null};function e6(F,j,b,h){if(F.visible===!1)return;if(F.layers.test(j.layers)){if(F.isGroup)b=F.renderOrder;else if(F.isLOD){if(F.autoUpdate===!0)F.update(j)}else if(F.isLight){if(q.pushLight(F),F.castShadow)q.pushShadow(F)}else if(F.isSprite){if(!F.frustumCulled||Y0.intersectsSprite(F)){if(h)MJ.setFromMatrixPosition(F.matrixWorld).applyMatrix4(WJ);let HJ=R.update(F),DJ=F.material;if(DJ.visible)k.push(F,HJ,DJ,b,MJ.z,null)}}else if(F.isMesh||F.isLine||F.isPoints){if(!F.frustumCulled||Y0.intersectsObject(F)){let HJ=R.update(F),DJ=F.material;if(h){if(F.boundingSphere!==void 0){if(F.boundingSphere===null)F.computeBoundingSphere();MJ.copy(F.boundingSphere.center)}else{if(HJ.boundingSphere===null)HJ.computeBoundingSphere();MJ.copy(HJ.boundingSphere.center)}MJ.applyMatrix4(F.matrixWorld).applyMatrix4(WJ)}if(Array.isArray(DJ)){let EJ=HJ.groups;for(let _J=0,wJ=EJ.length;_J<wJ;_J++){let zJ=EJ[_J],hJ=DJ[zJ.materialIndex];if(hJ&&hJ.visible)k.push(F,HJ,hJ,b,MJ.z,zJ)}}else if(DJ.visible)k.push(F,HJ,DJ,b,MJ.z,null)}}}let t=F.children;for(let HJ=0,DJ=t.length;HJ<DJ;HJ++)e6(t[HJ],j,b,h)}function W$(F,j,b,h){let{opaque:y,transmissive:t,transparent:HJ}=F;if(q.setupLightsView(b),mJ===!0)NJ.setGlobalState(V.clippingPlanes,b);if(h)RJ.viewport(L.copy(h));if(y.length>0)u9(y,j,b);if(t.length>0)u9(t,j,b);if(HJ.length>0)u9(HJ,j,b);RJ.buffers.depth.setTest(!0),RJ.buffers.depth.setMask(!0),RJ.buffers.color.setMask(!0),RJ.setPolygonOffset(!1)}function K$(F,j,b,h){if((b.isScene===!0?b.overrideMaterial:null)!==null)return;if(q.state.transmissionRenderTarget[h.id]===void 0)q.state.transmissionRenderTarget[h.id]=new Y8(1,1,{generateMipmaps:!0,type:yJ.has("EXT_color_buffer_half_float")||yJ.has("EXT_color_buffer_float")?S9:O8,minFilter:U9,samples:4,stencilBuffer:W,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:pJ.workingColorSpace});let t=q.state.transmissionRenderTarget[h.id],HJ=h.viewport||L;t.setSize(HJ.z*V.transmissionResolutionScale,HJ.w*V.transmissionResolutionScale);let DJ=V.getRenderTarget(),EJ=V.getActiveCubeFace(),_J=V.getActiveMipmapLevel();if(V.setRenderTarget(t),V.getClearColor(c),m=V.getClearAlpha(),m<1)V.setClearColor(16777215,0.5);if(V.clear(),SJ)FJ.render(b);let wJ=V.toneMapping;V.toneMapping=K8;let zJ=h.viewport;if(h.viewport!==void 0)h.viewport=void 0;if(q.setupLightsView(h),mJ===!0)NJ.setGlobalState(V.clippingPlanes,h);if(u9(F,b,h),IJ.updateMultisampleRenderTarget(t),IJ.updateRenderTargetMipmap(t),yJ.has("WEBGL_multisampled_render_to_texture")===!1){let hJ=!1;for(let sJ=0,Z0=j.length;sJ<Z0;sJ++){let tJ=j[sJ],oJ=tJ.object,BJ=tJ.geometry,Q0=tJ.material,dJ=tJ.group;if(Q0.side===o0&&oJ.layers.test(h.layers)){let C0=Q0.side;Q0.side=T0,Q0.needsUpdate=!0,Y$(oJ,b,h,BJ,Q0,dJ),Q0.side=C0,Q0.needsUpdate=!0,hJ=!0}}if(hJ===!0)IJ.updateMultisampleRenderTarget(t),IJ.updateRenderTargetMipmap(t)}if(V.setRenderTarget(DJ,EJ,_J),V.setClearColor(c,m),zJ!==void 0)h.viewport=zJ;V.toneMapping=wJ}function u9(F,j,b){let h=j.isScene===!0?j.overrideMaterial:null;for(let y=0,t=F.length;y<t;y++){let HJ=F[y],DJ=HJ.object,EJ=HJ.geometry,_J=HJ.group,wJ=HJ.material;if(wJ.allowOverride===!0&&h!==null)wJ=h;if(DJ.layers.test(b.layers))Y$(DJ,j,b,EJ,wJ,_J)}}function Y$(F,j,b,h,y,t){if(F.onBeforeRender(V,j,b,h,y,t),F.modelViewMatrix.multiplyMatrices(b.matrixWorldInverse,F.matrixWorld),F.normalMatrix.getNormalMatrix(F.modelViewMatrix),y.onBeforeRender(V,j,b,h,F,t),y.transparent===!0&&y.side===o0&&y.forceSinglePass===!1)y.side=T0,y.needsUpdate=!0,V.renderBufferDirect(b,j,h,y,F,t),y.side=W9,y.needsUpdate=!0,V.renderBufferDirect(b,j,h,y,F,t),y.side=o0;else V.renderBufferDirect(b,j,h,y,F,t);F.onAfterRender(V,j,b,h,y,t)}function c9(F,j,b){if(j.isScene!==!0)j=TJ;let h=LJ.get(F),y=q.state.lights,t=q.state.shadowsArray,HJ=y.state.version,DJ=v.getParameters(F,y.state,t,j,b),EJ=v.getProgramCacheKey(DJ),_J=h.programs;if(h.environment=F.isMeshStandardMaterial?j.environment:null,h.fog=j.fog,h.envMap=(F.isMeshStandardMaterial?N0:O0).get(F.envMap||h.environment),h.envMapRotation=h.environment!==null&&F.envMap===null?j.environmentRotation:F.envMapRotation,_J===void 0)F.addEventListener("dispose",a),_J=new Map,h.programs=_J;let wJ=_J.get(EJ);if(wJ!==void 0){if(h.currentProgram===wJ&&h.lightsStateVersion===HJ)return X$(F,DJ),wJ}else DJ.uniforms=v.getUniforms(F),F.onBeforeCompile(DJ,V),wJ=v.acquireProgram(DJ,EJ),_J.set(EJ,wJ),h.uniforms=DJ.uniforms;let zJ=h.uniforms;if(!F.isShaderMaterial&&!F.isRawShaderMaterial||F.clipping===!0)zJ.clippingPlanes=NJ.uniform;if(X$(F,DJ),h.needsLights=jW(F),h.lightsStateVersion=HJ,h.needsLights)zJ.ambientLightColor.value=y.state.ambient,zJ.lightProbe.value=y.state.probe,zJ.directionalLights.value=y.state.directional,zJ.directionalLightShadows.value=y.state.directionalShadow,zJ.spotLights.value=y.state.spot,zJ.spotLightShadows.value=y.state.spotShadow,zJ.rectAreaLights.value=y.state.rectArea,zJ.ltc_1.value=y.state.rectAreaLTC1,zJ.ltc_2.value=y.state.rectAreaLTC2,zJ.pointLights.value=y.state.point,zJ.pointLightShadows.value=y.state.pointShadow,zJ.hemisphereLights.value=y.state.hemi,zJ.directionalShadowMap.value=y.state.directionalShadowMap,zJ.directionalShadowMatrix.value=y.state.directionalShadowMatrix,zJ.spotShadowMap.value=y.state.spotShadowMap,zJ.spotLightMatrix.value=y.state.spotLightMatrix,zJ.spotLightMap.value=y.state.spotLightMap,zJ.pointShadowMap.value=y.state.pointShadowMap,zJ.pointShadowMatrix.value=y.state.pointShadowMatrix;return h.currentProgram=wJ,h.uniformsList=null,wJ}function H$(F){if(F.uniformsList===null){let j=F.currentProgram.getUniforms();F.uniformsList=p9.seqWithValue(j.seq,F.uniforms)}return F.uniformsList}function X$(F,j){let b=LJ.get(F);b.outputColorSpace=j.outputColorSpace,b.batching=j.batching,b.batchingColor=j.batchingColor,b.instancing=j.instancing,b.instancingColor=j.instancingColor,b.instancingMorph=j.instancingMorph,b.skinning=j.skinning,b.morphTargets=j.morphTargets,b.morphNormals=j.morphNormals,b.morphColors=j.morphColors,b.morphTargetsCount=j.morphTargetsCount,b.numClippingPlanes=j.numClippingPlanes,b.numIntersection=j.numClipIntersection,b.vertexAlphas=j.vertexAlphas,b.vertexTangents=j.vertexTangents,b.toneMapping=j.toneMapping}function TW(F,j,b,h,y){if(j.isScene!==!0)j=TJ;IJ.resetTextureUnits();let t=j.fog,HJ=h.isMeshStandardMaterial?j.environment:null,DJ=A===null?V.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:y9,EJ=(h.isMeshStandardMaterial?N0:O0).get(h.envMap||HJ),_J=h.vertexColors===!0&&!!b.attributes.color&&b.attributes.color.itemSize===4,wJ=!!b.attributes.tangent&&(!!h.normalMap||h.anisotropy>0),zJ=!!b.morphAttributes.position,hJ=!!b.morphAttributes.normal,sJ=!!b.morphAttributes.color,Z0=K8;if(h.toneMapped){if(A===null||A.isXRRenderTarget===!0)Z0=V.toneMapping}let tJ=b.morphAttributes.position||b.morphAttributes.normal||b.morphAttributes.color,oJ=tJ!==void 0?tJ.length:0,BJ=LJ.get(h),Q0=q.state.lights;if(mJ===!0){if(n===!0||F!==z){let V0=F===z&&h.id===x;NJ.setState(h,F,V0)}}let dJ=!1;if(h.version===BJ.__version){if(BJ.needsLights&&BJ.lightsStateVersion!==Q0.state.version)dJ=!0;else if(BJ.outputColorSpace!==DJ)dJ=!0;else if(y.isBatchedMesh&&BJ.batching===!1)dJ=!0;else if(!y.isBatchedMesh&&BJ.batching===!0)dJ=!0;else if(y.isBatchedMesh&&BJ.batchingColor===!0&&y.colorTexture===null)dJ=!0;else if(y.isBatchedMesh&&BJ.batchingColor===!1&&y.colorTexture!==null)dJ=!0;else if(y.isInstancedMesh&&BJ.instancing===!1)dJ=!0;else if(!y.isInstancedMesh&&BJ.instancing===!0)dJ=!0;else if(y.isSkinnedMesh&&BJ.skinning===!1)dJ=!0;else if(!y.isSkinnedMesh&&BJ.skinning===!0)dJ=!0;else if(y.isInstancedMesh&&BJ.instancingColor===!0&&y.instanceColor===null)dJ=!0;else if(y.isInstancedMesh&&BJ.instancingColor===!1&&y.instanceColor!==null)dJ=!0;else if(y.isInstancedMesh&&BJ.instancingMorph===!0&&y.morphTexture===null)dJ=!0;else if(y.isInstancedMesh&&BJ.instancingMorph===!1&&y.morphTexture!==null)dJ=!0;else if(BJ.envMap!==EJ)dJ=!0;else if(h.fog===!0&&BJ.fog!==t)dJ=!0;else if(BJ.numClippingPlanes!==void 0&&(BJ.numClippingPlanes!==NJ.numPlanes||BJ.numIntersection!==NJ.numIntersection))dJ=!0;else if(BJ.vertexAlphas!==_J)dJ=!0;else if(BJ.vertexTangents!==wJ)dJ=!0;else if(BJ.morphTargets!==zJ)dJ=!0;else if(BJ.morphNormals!==hJ)dJ=!0;else if(BJ.morphColors!==sJ)dJ=!0;else if(BJ.toneMapping!==Z0)dJ=!0;else if(BJ.morphTargetsCount!==oJ)dJ=!0}else dJ=!0,BJ.__version=h.version;let C0=BJ.currentProgram;if(dJ===!0)C0=c9(h,j,y);let l8=!1,w0=!1,M9=!1,$0=C0.getUniforms(),y0=BJ.uniforms;if(RJ.useProgram(C0.program))l8=!0,w0=!0,M9=!0;if(h.id!==x)x=h.id,w0=!0;if(l8||z!==F){if(RJ.buffers.depth.getReversed()&&F.reversedDepth!==!0)F._reversedDepth=!0,F.updateProjectionMatrix();$0.setValue(_,"projectionMatrix",F.projectionMatrix),$0.setValue(_,"viewMatrix",F.matrixWorldInverse);let B0=$0.map.cameraPosition;if(B0!==void 0)B0.setValue(_,QJ.setFromMatrixPosition(F.matrixWorld));if(AJ.logarithmicDepthBuffer)$0.setValue(_,"logDepthBufFC",2/(Math.log(F.far+1)/Math.LN2));if(h.isMeshPhongMaterial||h.isMeshToonMaterial||h.isMeshLambertMaterial||h.isMeshBasicMaterial||h.isMeshStandardMaterial||h.isShaderMaterial)$0.setValue(_,"isOrthographic",F.isOrthographicCamera===!0);if(z!==F)z=F,w0=!0,M9=!0}if(y.isSkinnedMesh){$0.setOptional(_,y,"bindMatrix"),$0.setOptional(_,y,"bindMatrixInverse");let V0=y.skeleton;if(V0){if(V0.boneTexture===null)V0.computeBoneTexture();$0.setValue(_,"boneTexture",V0.boneTexture,IJ)}}if(y.isBatchedMesh){if($0.setOptional(_,y,"batchingTexture"),$0.setValue(_,"batchingTexture",y._matricesTexture,IJ),$0.setOptional(_,y,"batchingIdTexture"),$0.setValue(_,"batchingIdTexture",y._indirectTexture,IJ),$0.setOptional(_,y,"batchingColorTexture"),y._colorsTexture!==null)$0.setValue(_,"batchingColorTexture",y._colorsTexture,IJ)}let v0=b.morphAttributes;if(v0.position!==void 0||v0.normal!==void 0||v0.color!==void 0)CJ.update(y,b,C0);if(w0||BJ.receiveShadow!==y.receiveShadow)BJ.receiveShadow=y.receiveShadow,$0.setValue(_,"receiveShadow",y.receiveShadow);if(h.isMeshGouraudMaterial&&h.envMap!==null)y0.envMap.value=EJ,y0.flipEnvMap.value=EJ.isCubeTexture&&EJ.isRenderTargetTexture===!1?-1:1;if(h.isMeshStandardMaterial&&h.envMap===null&&j.environment!==null)y0.envMapIntensity.value=j.environmentIntensity;if(w0){if($0.setValue(_,"toneMappingExposure",V.toneMappingExposure),BJ.needsLights)SW(y0,M9);if(t&&h.fog===!0)u.refreshFogUniforms(y0,t);u.refreshMaterialUniforms(y0,h,r,l,q.state.transmissionRenderTarget[F.id]),p9.upload(_,H$(BJ),y0,IJ)}if(h.isShaderMaterial&&h.uniformsNeedUpdate===!0)p9.upload(_,H$(BJ),y0,IJ),h.uniformsNeedUpdate=!1;if(h.isSpriteMaterial)$0.setValue(_,"center",y.center);if($0.setValue(_,"modelViewMatrix",y.modelViewMatrix),$0.setValue(_,"normalMatrix",y.normalMatrix),$0.setValue(_,"modelMatrix",y.matrixWorld),h.isShaderMaterial||h.isRawShaderMaterial){let V0=h.uniformsGroups;for(let B0=0,J7=V0.length;B0<J7;B0++){let B8=V0[B0];UJ.update(B8,C0),UJ.bind(B8,C0)}}return C0}function SW(F,j){F.ambientLightColor.needsUpdate=j,F.lightProbe.needsUpdate=j,F.directionalLights.needsUpdate=j,F.directionalLightShadows.needsUpdate=j,F.pointLights.needsUpdate=j,F.pointLightShadows.needsUpdate=j,F.spotLights.needsUpdate=j,F.spotLightShadows.needsUpdate=j,F.rectAreaLights.needsUpdate=j,F.hemisphereLights.needsUpdate=j}function jW(F){return F.isMeshLambertMaterial||F.isMeshToonMaterial||F.isMeshPhongMaterial||F.isMeshStandardMaterial||F.isShadowMaterial||F.isShaderMaterial&&F.lights===!0}this.getActiveCubeFace=function(){return S},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(F,j,b){let h=LJ.get(F);if(h.__autoAllocateDepthBuffer=F.resolveDepthBuffer===!1,h.__autoAllocateDepthBuffer===!1)h.__useRenderToTexture=!1;LJ.get(F.texture).__webglTexture=j,LJ.get(F.depthTexture).__webglTexture=h.__autoAllocateDepthBuffer?void 0:b,h.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(F,j){let b=LJ.get(F);b.__webglFramebuffer=j,b.__useDefaultFramebuffer=j===void 0};let yW=_.createFramebuffer();this.setRenderTarget=function(F,j=0,b=0){A=F,S=j,C=b;let h=!0,y=null,t=!1,HJ=!1;if(F){let EJ=LJ.get(F);if(EJ.__useDefaultFramebuffer!==void 0)RJ.bindFramebuffer(_.FRAMEBUFFER,null),h=!1;else if(EJ.__webglFramebuffer===void 0)IJ.setupRenderTarget(F);else if(EJ.__hasExternalTextures)IJ.rebindTextures(F,LJ.get(F.texture).__webglTexture,LJ.get(F.depthTexture).__webglTexture);else if(F.depthBuffer){let zJ=F.depthTexture;if(EJ.__boundDepthTexture!==zJ){if(zJ!==null&&LJ.has(zJ)&&(F.width!==zJ.image.width||F.height!==zJ.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");IJ.setupDepthRenderbuffer(F)}}let _J=F.texture;if(_J.isData3DTexture||_J.isDataArrayTexture||_J.isCompressedArrayTexture)HJ=!0;let wJ=LJ.get(F).__webglFramebuffer;if(F.isWebGLCubeRenderTarget){if(Array.isArray(wJ[j]))y=wJ[j][b];else y=wJ[j];t=!0}else if(F.samples>0&&IJ.useMultisampledRTT(F)===!1)y=LJ.get(F).__webglMultisampledFramebuffer;else if(Array.isArray(wJ))y=wJ[b];else y=wJ;L.copy(F.viewport),T.copy(F.scissor),d=F.scissorTest}else L.copy(GJ).multiplyScalar(r).floor(),T.copy(PJ).multiplyScalar(r).floor(),d=xJ;if(b!==0)y=yW;if(RJ.bindFramebuffer(_.FRAMEBUFFER,y)&&h)RJ.drawBuffers(F,y);if(RJ.viewport(L),RJ.scissor(T),RJ.setScissorTest(d),t){let EJ=LJ.get(F.texture);_.framebufferTexture2D(_.FRAMEBUFFER,_.COLOR_ATTACHMENT0,_.TEXTURE_CUBE_MAP_POSITIVE_X+j,EJ.__webglTexture,b)}else if(HJ){let EJ=j;for(let _J=0;_J<F.textures.length;_J++){let wJ=LJ.get(F.textures[_J]);_.framebufferTextureLayer(_.FRAMEBUFFER,_.COLOR_ATTACHMENT0+_J,wJ.__webglTexture,b,EJ)}}else if(F!==null&&b!==0){let EJ=LJ.get(F.texture);_.framebufferTexture2D(_.FRAMEBUFFER,_.COLOR_ATTACHMENT0,_.TEXTURE_2D,EJ.__webglTexture,b)}x=-1},this.readRenderTargetPixels=function(F,j,b,h,y,t,HJ,DJ=0){if(!(F&&F.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let EJ=LJ.get(F).__webglFramebuffer;if(F.isWebGLCubeRenderTarget&&HJ!==void 0)EJ=EJ[HJ];if(EJ){RJ.bindFramebuffer(_.FRAMEBUFFER,EJ);try{let _J=F.textures[DJ],wJ=_J.format,zJ=_J.type;if(!AJ.textureFormatReadable(wJ)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!AJ.textureTypeReadable(zJ)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}if(j>=0&&j<=F.width-h&&(b>=0&&b<=F.height-y)){if(F.textures.length>1)_.readBuffer(_.COLOR_ATTACHMENT0+DJ);_.readPixels(j,b,h,y,kJ.convert(wJ),kJ.convert(zJ),t)}}finally{let _J=A!==null?LJ.get(A).__webglFramebuffer:null;RJ.bindFramebuffer(_.FRAMEBUFFER,_J)}}},this.readRenderTargetPixelsAsync=async function(F,j,b,h,y,t,HJ,DJ=0){if(!(F&&F.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let EJ=LJ.get(F).__webglFramebuffer;if(F.isWebGLCubeRenderTarget&&HJ!==void 0)EJ=EJ[HJ];if(EJ)if(j>=0&&j<=F.width-h&&(b>=0&&b<=F.height-y)){RJ.bindFramebuffer(_.FRAMEBUFFER,EJ);let _J=F.textures[DJ],wJ=_J.format,zJ=_J.type;if(!AJ.textureFormatReadable(wJ))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!AJ.textureTypeReadable(zJ))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let hJ=_.createBuffer();if(_.bindBuffer(_.PIXEL_PACK_BUFFER,hJ),_.bufferData(_.PIXEL_PACK_BUFFER,t.byteLength,_.STREAM_READ),F.textures.length>1)_.readBuffer(_.COLOR_ATTACHMENT0+DJ);_.readPixels(j,b,h,y,kJ.convert(wJ),kJ.convert(zJ),0);let sJ=A!==null?LJ.get(A).__webglFramebuffer:null;RJ.bindFramebuffer(_.FRAMEBUFFER,sJ);let Z0=_.fenceSync(_.SYNC_GPU_COMMANDS_COMPLETE,0);return _.flush(),await bZ(_,Z0,4),_.bindBuffer(_.PIXEL_PACK_BUFFER,hJ),_.getBufferSubData(_.PIXEL_PACK_BUFFER,0,t),_.deleteBuffer(hJ),_.deleteSync(Z0),t}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(F,j=null,b=0){let h=Math.pow(2,-b),y=Math.floor(F.image.width*h),t=Math.floor(F.image.height*h),HJ=j!==null?j.x:0,DJ=j!==null?j.y:0;IJ.setTexture2D(F,0),_.copyTexSubImage2D(_.TEXTURE_2D,b,0,0,HJ,DJ,y,t),RJ.unbindTexture()};let vW=_.createFramebuffer(),fW=_.createFramebuffer();if(this.copyTextureToTexture=function(F,j,b=null,h=null,y=0,t=null){if(t===null)if(y!==0)Z9("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),t=y,y=0;else t=0;let HJ,DJ,EJ,_J,wJ,zJ,hJ,sJ,Z0,tJ=F.isCompressedTexture?F.mipmaps[t]:F.image;if(b!==null)HJ=b.max.x-b.min.x,DJ=b.max.y-b.min.y,EJ=b.isBox3?b.max.z-b.min.z:1,_J=b.min.x,wJ=b.min.y,zJ=b.isBox3?b.min.z:0;else{let v0=Math.pow(2,-y);if(HJ=Math.floor(tJ.width*v0),DJ=Math.floor(tJ.height*v0),F.isDataArrayTexture)EJ=tJ.depth;else if(F.isData3DTexture)EJ=Math.floor(tJ.depth*v0);else EJ=1;_J=0,wJ=0,zJ=0}if(h!==null)hJ=h.x,sJ=h.y,Z0=h.z;else hJ=0,sJ=0,Z0=0;let oJ=kJ.convert(j.format),BJ=kJ.convert(j.type),Q0;if(j.isData3DTexture)IJ.setTexture3D(j,0),Q0=_.TEXTURE_3D;else if(j.isDataArrayTexture||j.isCompressedArrayTexture)IJ.setTexture2DArray(j,0),Q0=_.TEXTURE_2D_ARRAY;else IJ.setTexture2D(j,0),Q0=_.TEXTURE_2D;_.pixelStorei(_.UNPACK_FLIP_Y_WEBGL,j.flipY),_.pixelStorei(_.UNPACK_PREMULTIPLY_ALPHA_WEBGL,j.premultiplyAlpha),_.pixelStorei(_.UNPACK_ALIGNMENT,j.unpackAlignment);let dJ=_.getParameter(_.UNPACK_ROW_LENGTH),C0=_.getParameter(_.UNPACK_IMAGE_HEIGHT),l8=_.getParameter(_.UNPACK_SKIP_PIXELS),w0=_.getParameter(_.UNPACK_SKIP_ROWS),M9=_.getParameter(_.UNPACK_SKIP_IMAGES);_.pixelStorei(_.UNPACK_ROW_LENGTH,tJ.width),_.pixelStorei(_.UNPACK_IMAGE_HEIGHT,tJ.height),_.pixelStorei(_.UNPACK_SKIP_PIXELS,_J),_.pixelStorei(_.UNPACK_SKIP_ROWS,wJ),_.pixelStorei(_.UNPACK_SKIP_IMAGES,zJ);let $0=F.isDataArrayTexture||F.isData3DTexture,y0=j.isDataArrayTexture||j.isData3DTexture;if(F.isDepthTexture){let v0=LJ.get(F),V0=LJ.get(j),B0=LJ.get(v0.__renderTarget),J7=LJ.get(V0.__renderTarget);RJ.bindFramebuffer(_.READ_FRAMEBUFFER,B0.__webglFramebuffer),RJ.bindFramebuffer(_.DRAW_FRAMEBUFFER,J7.__webglFramebuffer);for(let B8=0;B8<EJ;B8++){if($0)_.framebufferTextureLayer(_.READ_FRAMEBUFFER,_.COLOR_ATTACHMENT0,LJ.get(F).__webglTexture,y,zJ+B8),_.framebufferTextureLayer(_.DRAW_FRAMEBUFFER,_.COLOR_ATTACHMENT0,LJ.get(j).__webglTexture,t,Z0+B8);_.blitFramebuffer(_J,wJ,HJ,DJ,hJ,sJ,HJ,DJ,_.DEPTH_BUFFER_BIT,_.NEAREST)}RJ.bindFramebuffer(_.READ_FRAMEBUFFER,null),RJ.bindFramebuffer(_.DRAW_FRAMEBUFFER,null)}else if(y!==0||F.isRenderTargetTexture||LJ.has(F)){let v0=LJ.get(F),V0=LJ.get(j);RJ.bindFramebuffer(_.READ_FRAMEBUFFER,vW),RJ.bindFramebuffer(_.DRAW_FRAMEBUFFER,fW);for(let B0=0;B0<EJ;B0++){if($0)_.framebufferTextureLayer(_.READ_FRAMEBUFFER,_.COLOR_ATTACHMENT0,v0.__webglTexture,y,zJ+B0);else _.framebufferTexture2D(_.READ_FRAMEBUFFER,_.COLOR_ATTACHMENT0,_.TEXTURE_2D,v0.__webglTexture,y);if(y0)_.framebufferTextureLayer(_.DRAW_FRAMEBUFFER,_.COLOR_ATTACHMENT0,V0.__webglTexture,t,Z0+B0);else _.framebufferTexture2D(_.DRAW_FRAMEBUFFER,_.COLOR_ATTACHMENT0,_.TEXTURE_2D,V0.__webglTexture,t);if(y!==0)_.blitFramebuffer(_J,wJ,HJ,DJ,hJ,sJ,HJ,DJ,_.COLOR_BUFFER_BIT,_.NEAREST);else if(y0)_.copyTexSubImage3D(Q0,t,hJ,sJ,Z0+B0,_J,wJ,HJ,DJ);else _.copyTexSubImage2D(Q0,t,hJ,sJ,_J,wJ,HJ,DJ)}RJ.bindFramebuffer(_.READ_FRAMEBUFFER,null),RJ.bindFramebuffer(_.DRAW_FRAMEBUFFER,null)}else if(y0)if(F.isDataTexture||F.isData3DTexture)_.texSubImage3D(Q0,t,hJ,sJ,Z0,HJ,DJ,EJ,oJ,BJ,tJ.data);else if(j.isCompressedArrayTexture)_.compressedTexSubImage3D(Q0,t,hJ,sJ,Z0,HJ,DJ,EJ,oJ,tJ.data);else _.texSubImage3D(Q0,t,hJ,sJ,Z0,HJ,DJ,EJ,oJ,BJ,tJ);else if(F.isDataTexture)_.texSubImage2D(_.TEXTURE_2D,t,hJ,sJ,HJ,DJ,oJ,BJ,tJ.data);else if(F.isCompressedTexture)_.compressedTexSubImage2D(_.TEXTURE_2D,t,hJ,sJ,tJ.width,tJ.height,oJ,tJ.data);else _.texSubImage2D(_.TEXTURE_2D,t,hJ,sJ,HJ,DJ,oJ,BJ,tJ);if(_.pixelStorei(_.UNPACK_ROW_LENGTH,dJ),_.pixelStorei(_.UNPACK_IMAGE_HEIGHT,C0),_.pixelStorei(_.UNPACK_SKIP_PIXELS,l8),_.pixelStorei(_.UNPACK_SKIP_ROWS,w0),_.pixelStorei(_.UNPACK_SKIP_IMAGES,M9),t===0&&j.generateMipmaps)_.generateMipmap(Q0);RJ.unbindTexture()},this.initRenderTarget=function(F){if(LJ.get(F).__webglFramebuffer===void 0)IJ.setupRenderTarget(F)},this.initTexture=function(F){if(F.isCubeTexture)IJ.setTextureCube(F,0);else if(F.isData3DTexture)IJ.setTexture3D(F,0);else if(F.isDataArrayTexture||F.isCompressedArrayTexture)IJ.setTexture2DArray(F,0);else IJ.setTexture2D(F,0);RJ.unbindTexture()},this.resetState=function(){S=0,C=0,A=null,RJ.reset(),VJ.reset()},typeof __THREE_DEVTOOLS__!=="undefined")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return qQ}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(J){this._outputColorSpace=J;let Q=this.getContext();Q.drawingBufferColorSpace=pJ._getDrawingBufferColorSpace(J),Q.unpackColorSpace=pJ._getUnpackColorSpace()}}var m9=document.getElementById("graph"),zW=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function dU(J){let Q=J>>>0;return()=>{return Q=Q*1664525+1013904223>>>0,Q/4294967296}}var _0=dU(20260817),F9=()=>(_0()+_0()+_0()-1.5)/1.5,aQ=[{x:5.4,y:-0.4,z:0.4,r:1.8,n:96,order:0},{x:8.4,y:2.3,z:-1.4,r:1.8,n:84,order:1},{x:2.6,y:3.3,z:-1,r:1.7,n:78,order:2},{x:7.6,y:-3.6,z:-2.2,r:1.7,n:76,order:3},{x:2.2,y:-3.1,z:-1.8,r:1.8,n:74,order:4},{x:11.4,y:-0.4,z:-3.4,r:1.9,n:72,order:5},{x:5.6,y:4.6,z:-3.2,r:1.5,n:58,order:6},{x:-0.8,y:0.6,z:-2.6,r:1.7,n:62,order:7},{x:10.6,y:4.2,z:-4.4,r:1.6,n:56,order:8},{x:13.2,y:1.6,z:-2.2,r:1.7,n:54,order:9},{x:-3.4,y:-3.4,z:-3,r:1.6,n:48,order:10},{x:-2.6,y:4,z:-4.2,r:1.5,n:44,order:11}],lU=0.16,tQ=1.5;function uU(J){let Q=[];aQ.forEach((K,H)=>{let Y=Math.max(14,Math.round(K.n*J));for(let X=0;X<Y;X++){let U=X===0,E=K.order*lU+_0()*0.42,G=[F9(),F9(),F9()],N=7+_0()*13;Q.push({cluster:H,x:K.x+F9()*K.r,y:K.y+F9()*K.r*0.8,z:K.z+F9()*K.r*0.7,sx:K.x+G[0]*N,sy:K.y+G[1]*N*0.7,sz:K.z+G[2]*N*0.5-_0()*4,delay:E,seed:_0(),hub:U,size:U?4.4:0.9+_0()*1.35,raw:!U&&_0()<0.24})}});let $=new Set,Z=(K,H)=>K<H?`${K}:${H}`:`${H}:${K}`;for(let K=0;K<Q.length;K++){let H=Q[K],Y=[];for(let X=0;X<Q.length;X++){if(K===X||Q[X].cluster!==H.cluster)continue;let U=Q[X];Y.push([(H.x-U.x)**2+(H.y-U.y)**2+(H.z-U.z)**2,X])}Y.sort((X,U)=>X[0]-U[0]);for(let X=0;X<Math.min(2,Y.length);X++){if(Y[X][0]>6.8)break;$.add(Z(K,Y[X][1]))}}let W=Q.map((K,H)=>K.hub?H:-1).filter((K)=>K>=0);for(let K=0;K<W.length;K++)for(let H=K+1;H<W.length;H++){let Y=Q[W[K]],X=Q[W[H]];if(Math.hypot(Y.x-X.x,Y.y-X.y,Y.z-X.z)<4&&Math.abs(Y.z-X.z)<1.8&&_0()<0.55)$.add(Z(W[K],W[H]))}return{nodes:Q,edges:[...$].map((K)=>K.split(":").map(Number))}}var cU=window.innerWidth<760,{nodes:x0,edges:V8}=uU(cU?0.5:1),BW=`
  uniform float uTime;
  uniform vec3 uWave[2];      // where each digest pass started
  uniform vec2 uWaveClock[2]; // x: start time, y: -1 when idle
  uniform vec3 uPointer;   // pointer, in the field's own coordinates
  attribute float aSeed;
  attribute float aDelay;   // when this fragment starts flying in
  attribute vec3 aScatter;  // where it waits before that
  attribute float aDigest;  // when it gets filed, -1 if it is not a raw capture

  const float FLIGHT = ${tQ.toFixed(2)};

  float ease(float t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

  float arrival() {
    return clamp((uTime - aDelay) / FLIGHT, 0.0, 1.0);
  }

  vec3 place(vec3 target, float a) {
    float t = uTime * 0.34;
    vec3 drift = vec3(
      sin(t * 0.7 + aSeed * 39.0),
      cos(t * 0.6 + aSeed * 27.0),
      sin(t * 0.5 + aSeed * 53.0)
    ) * 0.24;
    return mix(aScatter, target + drift, ease(a));
  }

  // Brightness of the digest waves as they sweep past a point. Two run at a
  // time, so one part of the memory is always being filed.
  float wave(vec3 p) {
    float lit = 0.0;
    for (int i = 0; i < 2; i++) {
      if (uWaveClock[i].y < 0.0) continue;
      float age = uTime - uWaveClock[i].x;
      float band = exp(-pow((distance(p, uWave[i]) - age * 3.4) * 1.3, 2.0));
      lit += band * smoothstep(3.8, 0.0, age);
    }
    return min(lit, 1.7);
  }

  float nearPointer(vec3 p) {
    return smoothstep(3.6, 0.5, distance(p.xy, uPointer.xy));
  }
`,D0={uTime:{value:0},uWave:{value:new Float32Array([0,0,0,0,0,0])},uWaveClock:{value:new Float32Array([0,-1,0,-1])},uPointer:{value:new Float32Array([60,60,0])},uPixelRatio:{value:1},uFade:{value:0}},nU=new j0({transparent:!0,depthWrite:!1,blending:K9,uniforms:D0,vertexShader:`
    ${BW}
    uniform float uPixelRatio;
    attribute float aSize;
    attribute float aRaw;
    varying float vGlow;
    varying float vFiled;
    varying float vFlash;
    void main() {
      float a = arrival();
      vec3 p = place(position, a);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      float w = wave(p);
      // The moment of landing: a short, bright pop that settles.
      vFlash = exp(-max(0.0, uTime - aDelay - FLIGHT) * 2.6) * step(0.999, a);
      float depth = smoothstep(24.0, 8.0, -mv.z);
      vGlow = (0.62 + a * 0.5 + w * 1.9 + vFlash * 1.5 + nearPointer(p) * 0.85)
            * (0.5 + depth * 0.5);
      // A raw capture becomes a wiki node once the wave has passed it.
      vFiled = aRaw > 0.5 ? (aDigest < 0.0 ? 0.0 : smoothstep(0.0, 1.4, uTime - aDigest)) : 1.0;
      gl_PointSize = aSize * uPixelRatio * (0.6 + a * 0.4 + w * 0.9 + vFlash * 1.2)
                   * (46.0 / -mv.z);
    }
  `,fragmentShader:`
    uniform float uFade;
    varying float vGlow;
    varying float vFiled;
    varying float vFlash;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      // Two tiers: a hard core and a wide soft halo, which is what reads as
      // bloom on an additive buffer without a post pass.
      float core = smoothstep(0.42, 0.16, d);
      float halo = pow(smoothstep(0.5, 0.0, d), 2.0) * (0.42 + vFlash * 0.6);
      vec3 raw  = vec3(0.92, 0.66, 0.38);
      vec3 wiki = vec3(0.52, 0.68, 1.0);
      vec3 c = mix(raw, wiki, vFiled);
      float alpha = (core + halo) * vGlow * uFade;
      if (alpha < 0.004) discard;
      gl_FragColor = vec4(c * (0.78 + vGlow * 0.42), alpha);
    }
  `}),sU=new j0({transparent:!0,depthWrite:!1,blending:K9,uniforms:D0,vertexShader:`
    ${BW}
    attribute float aFormed; // when both ends of this link have landed
    varying float vAlpha;
    void main() {
      float a = arrival();
      vec3 p = place(position, a);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      float age = uTime - aFormed;
      float born = smoothstep(0.0, 0.22, age);
      float flare = exp(-max(age, 0.0) * 1.9) * 0.85;
      float depth = 0.55 + 0.45 * smoothstep(24.0, 8.0, -mv.z);
      vAlpha = born * (0.19 + flare + wave(p) * 0.95 + nearPointer(p) * 0.3) * depth;
    }
  `,fragmentShader:`
    uniform float uFade;
    varying float vAlpha;
    void main() {
      gl_FragColor = vec4(0.46, 0.62, 0.98, vAlpha * uFade);
    }
  `}),u0=x0.length,L8=new S0,IW=new Float32Array(u0*3),_W=new Float32Array(u0*3),CW=new Float32Array(u0),r6=new Float32Array(u0),wW=new Float32Array(u0),eQ=new Float32Array(u0),a6=new Float32Array(u0).fill(-1);x0.forEach((J,Q)=>{IW.set([J.x,J.y,J.z],Q*3),_W.set([J.sx,J.sy,J.sz],Q*3),CW[Q]=J.seed,r6[Q]=J.delay,wW[Q]=J.size,eQ[Q]=J.raw?1:0});var J$=new aJ(a6,1),Q$=new aJ(eQ,1),t6=new aJ(r6,1);J$.setUsage(S8);Q$.setUsage(S8);t6.setUsage(S8);L8.setAttribute("position",new aJ(IW,3));L8.setAttribute("aScatter",new aJ(_W,3));L8.setAttribute("aSeed",new aJ(CW,1));L8.setAttribute("aDelay",t6);L8.setAttribute("aSize",new aJ(wW,1));L8.setAttribute("aRaw",Q$);L8.setAttribute("aDigest",J$);var d8=new S0,PW=new Float32Array(V8.length*6),AW=new Float32Array(V8.length*6),rQ=new Float32Array(V8.length*2),d9=new Float32Array(V8.length*2),l9=new Float32Array(V8.length*2),iU=new Float32Array(V8.length*2).fill(-1);V8.forEach(([J,Q],$)=>{let Z=x0[J],W=x0[Q];PW.set([Z.x,Z.y,Z.z,W.x,W.y,W.z],$*6),AW.set([Z.sx,Z.sy,Z.sz,W.sx,W.sy,W.sz],$*6),rQ[$*2]=Z.seed,rQ[$*2+1]=W.seed,d9[$*2]=Z.delay,d9[$*2+1]=W.delay;let K=Math.max(Z.delay,W.delay)+tQ;l9[$*2]=K,l9[$*2+1]=K});var $$=new aJ(d9,1),Z$=new aJ(l9,1);$$.setUsage(S8);Z$.setUsage(S8);d8.setAttribute("position",new aJ(PW,3));d8.setAttribute("aScatter",new aJ(AW,3));d8.setAttribute("aSeed",new aJ(rQ,1));d8.setAttribute("aDelay",$$);d8.setAttribute("aFormed",Z$);d8.setAttribute("aDigest",new aJ(iU,1));var m8;try{m8=new oQ({canvas:m9,alpha:!0,antialias:!1,powerPreference:"high-performance"})}catch(J){document.documentElement.classList.add("no-webgl")}if(!m8||!m8.getContext())document.documentElement.classList.add("no-webgl");else{let N=function(){let V=m9.getBoundingClientRect(),I=Math.min(window.devicePixelRatio||1,2);m8.setPixelRatio(I),m8.setSize(V.width,V.height,!1),D0.uPixelRatio.value=I,Q.aspect=V.width/Math.max(V.height,1);let S=Q.aspect>1.1;Z.x=S?2:5.2,Z.z=S?12.6:20.5,W.x=S?3:5.2,Q.updateProjectionMatrix()},O=function(V){let I=aQ[X*5%aQ.length],S=X%2;X+=1,D0.uWave.value[S*3]=I.x,D0.uWave.value[S*3+1]=I.y,D0.uWave.value[S*3+2]=I.z,D0.uWaveClock.value[S*2]=V,D0.uWaveClock.value[S*2+1]=1;for(let A=0;A<u0;A++){let x=x0[A];if(!x.raw||a6[A]>=0)continue;let z=Math.hypot(x.x-I.x,x.y-I.y,x.z-I.z);if(z<5.5)a6[A]=V+z/3.6}let C=0;for(let A=0;A<u0&&C<7;A++){let x=x0[A];if(x.hub||x.raw)continue;if(Math.hypot(x.x-I.x,x.y-I.y,x.z-I.z)>5.5)continue;if(_0()<0.07)x.raw=!0,eQ[A]=1,a6[A]=-1,C+=1}Q$.needsUpdate=!0,J$.needsUpdate=!0},M=function(V){for(let I=0;I<u0;I++)r6[I]=x0[I].delay+V+0.35;V8.forEach(([I,S],C)=>{d9[C*2]=x0[I].delay+V+0.35,d9[C*2+1]=x0[S].delay+V+0.35;let A=Math.max(x0[I].delay,x0[S].delay)+tQ+V+0.35;l9[C*2]=A,l9[C*2+1]=A}),t6.needsUpdate=!0,$$.needsUpdate=!0,Z$.needsUpdate=!0},k=function(V){for(let I=0;I<40;I++){let S=Math.floor(_0()*u0);if(x0[S].hub)continue;r6[S]=V,t6.needsUpdate=!0;return}},q=function(V){let I=V/1000;if(D0.uTime.value=I,D0.uFade.value=Math.min(1,D0.uFade.value+0.02),I>U)O(I),U=I+2.6+_0()*1.8;if(I>E)k(I),E=I+1.1+_0()*1.9;K.x+=(K.tx-K.x)*0.05,K.y+=(K.ty-K.y)*0.05,D0.uPointer.value[0]=H.x,D0.uPointer.value[1]=H.y;let S=m9.getBoundingClientRect();if(Y=Math.min(1,Math.max(0,-S.top/Math.max(S.height,1))),Q.position.set(Z.x-K.x*1.6,Z.y-K.y*1+Y*1.4,Z.z-Y*2.2),Q.lookAt(W.x+K.x*0.5,W.y-K.y*0.35,W.z),$.rotation.y=I*0.014+K.x*0.05+Y*0.16,$.rotation.x=-K.y*0.03,D0.uFade.value=Math.min(D0.uFade.value,1-Y*0.55),m8.render(J,Q),G)requestAnimationFrame(q)},D=function(){if(G||zW)return;G=!0,requestAnimationFrame(q)},P=function(){G=!1},J=new g6,Q=new L0(42,1,0.1,120),$=new q8;$.add(new d6(L8,nU)),$.add(new m6(d8,sU)),J.add($);let Z={x:2,y:0.2,z:12.6},W={x:3,y:0.1,z:-2},K={x:0,y:0,tx:0,ty:0,seen:!1},H={x:60,y:60},Y=0,X=0,U=3.9,E=6.2,G=!1;if(N(),window.addEventListener("resize",N,{passive:!0}),zW)D0.uTime.value=9,D0.uFade.value=1,O(8.1),Q.position.set(Z.x,Z.y,Z.z),Q.lookAt(W.x,W.y,W.z),m8.render(J,Q);else{D(),window.addEventListener("pointermove",(I)=>{let S=m9.getBoundingClientRect(),C=(I.clientX-S.left)/S.width,A=(I.clientY-S.top)/S.height;K.tx=C*2-1,K.ty=A*2-1,K.seen=!0,H.x=W.x-8+C*17,H.y=5-A*10},{passive:!0});let V=m9.closest(".hero");if(V&&"IntersectionObserver"in window){let I=0;new IntersectionObserver(([S])=>{if(!S.isIntersecting){I=performance.now(),P();return}if(I&&performance.now()-I>4000)M(performance.now()/1000),D0.uFade.value=0.2;D()},{threshold:0}).observe(V)}document.addEventListener("visibilitychange",()=>document.hidden?P():D())}}
