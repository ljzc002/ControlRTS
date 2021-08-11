var One=function(){
    this.pos={x:0,y:1,z:0};
    this.radius=0.2;
    this.view=5;//视野（地块数）
    this.id=null;
    this.arr_history=[];
    //----20210723RTS
    this.hp=4;
    this.at=2;
    this.owner=null;
    this.influence=5;
}
var bing0;
//在平面社交网络中建立多个One，注意他们不能重叠
//参数：保存One的数组，建立个数，x方向范围【】，z方向范围【】
One.createRandomThem=function(obj_them,count){
    // bing0=new BABYLON.Sprite("bing0", obj_owners.a);
    // bing0.position.y=10;
    // bing0.playAnimation(0,8,true,100);

    for(var i=0;i<count;i++)
    {
        var one=new One();
        one.id="One_"+i;
        var owner=newland.RandomChooseFromObj(obj_owners)
        one.owner=owner.key;
        //先关联群组，然后使用群组的位置设定方法
        var randomPos=new BABYLON.Vector3(0,0,0);
        if(one.owner=="a")
        {
            randomPos = navigationPlugin.getRandomPointAround(new BABYLON.Vector3(20.0, 0.2, 0), 0.5);
        }
        else
        {
            randomPos = navigationPlugin.getRandomPointAround(new BABYLON.Vector3(-20.0, 0.2, 0), 0.5);
        }

        var transform = new BABYLON.TransformNode();
        //agentCube.parent = transform;
        var agentIndex = MyGame.crowd.addAgent(randomPos, MyGame.agentParams, transform);

        var bing=new BABYLON.Sprite("bing_"+one.id, owner.value);
        //这里bing的size是默认的1！！
        //transform.pathPoints=[transform.position];
        var state={//这部分由逻辑线程处理，
            feeling:"free",
            wanting:"waiting",
            doing:"waiting",
            being:{},//一个单位可能同时受到多种影响
        }
        transform.position=randomPos;
        bing.position=transform.position;//精灵没有parent属性！！
        one.pos={x:transform.position.x,y:transform.position.y,z:transform.position.z}
        one.idx=agentIndex;
        one.trf=transform;
        one.mesh=bing;
        var kuang=MyGame.mesh_k1.createInstance("k1_"+one.id);
        kuang.isVisible=false;
        kuang.parent=transform;
        //var kuang =new BABYLON.Sprite("sprite_kuang_"+one.id, MyGame.spriteManagerPlayerK);//显示在bing周围的白框，用来表示选中
        //kuang.isVisible=false;
        //kuang.size=0.8;
        //kuang.position.y=0.5;
        one.kuang=kuang;
        kuang.unit=one;
        one.target=null;
        one.data={state:state};
        bing.unit=one;
        arr_unit.push(one);

        //one.arr_history.push(obj);//记录单位的最初状态
        obj_them[one.id]=one;
    }
    return obj_them;//既改变又返回

}
One.setPos=function(obj_them,one,arr_x,arr_z)
{
    one.pos.x=newland.RandomBetween(arr_x[0],arr_x[1]);
    one.pos.z=newland.RandomBetween(arr_z[0],arr_z[1]);
    for(var key in obj_them)
    {
        var olderOne=obj_them[key];
        if(vxz.distance(olderOne.pos,one.pos)<(olderOne.radius+one.radius))//如果太近
        {
            One.setPos(obj_them,one,arr_x,arr_z);//第一次未失败的递归会设定pos
            break;
        }
    }
    return one;
}
//把单位对象集群转化为易于传输的格式，主要是剔除了网格信息
One.obj2data=function(obj_them){
    var obj_send={};
    for(var key in obj_them)
    {
        var one=obj_them[key];
        var obj_p={
            pos:one.pos,
            radius:one.radius,
            view:one.view,
            id:one.id,
            hp:one.hp,
            at:one.at,
            owner:one.owner,
            influence:one.influence,
            doing:one.data.state.doing,
            wanting:one.data.state.wanting,
            feeling:one.data.state.feeling,
            target:one.target,
        }
        obj_send[key]=obj_p;
    }
    return obj_send;
}
One.prototype.attack=function(targetid)
{
    var that=this;
    var target=obj_units[targetid];
    if(target.hp<=0)
    {
        this.data.state.doing="waiting";
        return;
    }
    this.face=target.trf.position.subtract(this.trf.position);
    // if(target.trf.position.x-this.trf.position.x<0)
    // {
    //     this.mesh.invertU=true;
    // }
    // else
    // {
    //     this.mesh.invertU=false;
    // }
    //this.mesh.stopAnimation();//停止之前的行走动画，否则无法进入攻击动画《-启动下个play会自动停止上一个
    if(this.data.state.doing!="attacking")//等待上次攻击完成
    {
        this.data.state.doing="attacking";
        //同时也应该停止寻路移动！？《-是的，否则会继续向远处走
        MyGame.crowd.agentTeleport(this.idx, this.mesh.position);
        this.mesh.playAnimation(0, 6, false, 200,function(){//行动结束恢复思考能力
            that.data.state.doing="waiting";
            var target=obj_units[targetid];
            if(target.data.state.doing!="dead")
            {
                target.hp-=2;
                var side;
                if(that.mesh.invertU==true)
                {
                    side="左";
                }
                else
                {
                    side="右";
                }
                if(target.hp>0)
                {
                    target.hurt(side);
                }
                else
                {
                    target.mesh.stopAnimation();
                    target.data.state.doing="dead";
                    target.data.state.being={};
                    target.data.state.wanting="dead";
                    target.data.state.feeling="dead";
                    target.dead(side);
                }
            }
        });
    }



}
One.prototype.move=function(pos)
{
    var agents = MyGame.crowd.getAgents();

    var pos_t=new BABYLON.Vector3(pos.x,pos.y,pos.z);
    //this.face=target.trf.position.subtract(this.trf.position);
    // if(pos_t.x-this.trf.position.x<0)
    // {
    //     this.mesh.invertU=true;
    // }
    // else
    // {
    //     this.mesh.invertU=false;
    // }
    if(!this.mesh.animationStarted)//过于频繁的调用动画，看起来就像没有动画！！
    {//
        this.mesh.playAnimation(6, 8, true, 100);
    }

    //MyGame.crowd.agentGoto(agents[this.idx], navigationPlugin.getClosestPoint(pos_t));
    MyGame.crowd.agentGoto(this.idx, navigationPlugin.getClosestPoint(pos_t));
}
One.prototype.hurt=function(side){
    //scene.stopAnimation();
    var ani=new BABYLON.Animation("animation_hurt_"+this.id,"angle",30
        ,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var keys=[{frame:0,value:0}
        ,{frame:15,value:side=="左"?Math.PI/4:-Math.PI/4},{frame:30,value:0}];
    ani.setKeys(keys);
    this.mesh.animations.push(ani);
    scene.beginAnimation(this.mesh,0,30,false,1 );
}
One.prototype.dead=function(side){
    var ani=new BABYLON.Animation("animation_hurt_"+this.id,"angle",30
        ,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    var keys=[{frame:0,value:0}
        ,{frame:30,value:side=="左"?Math.PI/2:-Math.PI/2}];
    ani.setKeys(keys);
    this.mesh.animations.push(ani);
    var that=this;
    scene.beginAnimation(this.mesh,0,30,false,1 ,function(){
        // this.data.state.doing="dead";
        // this.data.state.being={};
        // this.data.state.wanting="dead";
        // this.data.state.feeling="dead";
        MyGame.crowd.removeAgent(that.idx);//移除导航物体，但仍保持精灵显示
        MyGame.crowd.update();

        setTimeout(function(){
            that.trf.dispose();
            that.mesh.dispose();
            that.kuang.dispose();
        },2000)
    });
}
