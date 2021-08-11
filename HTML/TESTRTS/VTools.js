//在xyz描述下的2维和3维向量计算方法
var vxz={},vxyz={}
vxz.distance=function(a,b)//取平面两点间距离
{
    return Math.pow(Math.pow(a.x-b.x,2)+Math.pow(a.z-b.z,2),0.5);
}
vxz.substract=function(posFrom,posTo)//取两个二元向量的差向量
{
    var posRes={x:posTo.x-posFrom.x,z:posTo.z-posFrom.z};
    return posRes;
}
vxz.normal=function(pos)//标准化二元向量
{
    var length=Math.pow(pos.x*pos.x+pos.z*pos.z,0.5);
    var posRes={x:pos.x/length,z:pos.z/length};
    return posRes;
}
vxz.times=function(pos,times)//二元向量伸缩
{
    var posRes={x:pos.x*times,z:pos.z*times};
    return posRes;
}
vxz.add=function(unit1,unit2)
{
    var posRes={x:unit1.x+unit2.x,z:unit1.z+unit2.z};
    return posRes;
}
vxz.isSameSide=function(vec1,vec2)
{
    var side=vec1.x*vec2.x+vec1.z*vec2.z;
    return side;
}