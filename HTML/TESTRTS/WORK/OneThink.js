var OneThink=function(obj_p)
{
    this.pos=obj_p.pos;//xz表示平面社交网络，y表示社交地位
    this.radius=obj_p.radius;
    this.view=obj_p.view;
    this.id=obj_p.id;
    this.hp=obj_p.hp;
    this.at=obj_p.at;
    this.owner=obj_p.owner;
    this.influence=obj_p.influence;
    this.doing="standing";//正在做的事
    this.wanting="waiting";//想要做的事
    this.being={};//正在遭受
    this.feeling="free";
}
//在计算每个单位的当前影响范围前，先清空旧的影响范围《-影响范围变化率如果很低则这个计算会比较冗余
OneThink.clearAllInfluence=function(arr_part){
    arr_part.forEach((arr,i)=>{
        arr.forEach((obj_part,j)=>{
            obj_part.arr_influence=[];
        })
    })
}
OneThink.oneMakeInfluence=function(unit,arr_part,partSize){
    //考虑到不同的单位被发现的可能性不同，所以不能只从观察者向周围看，要先用被观察者对周围造成影响
    //对于自己所不在的地块注入影响力
    var arr_part_found=OneThink.getArrPartbyStep(arr_part[unit.partx][unit.partz],unit.influence);
    arr_part_found.forEach((obj)=>{
        for(var xz in obj)
        {
            var obj_part=obj[xz];
            obj_part.arr_influence.push(unit);
        }
    })
}
//参数：单位对象、其他所有单位对象、地块索引表
OneThink.think=function(unit,obj_units,arr_part){
    var arr_command=[];//返回的命令数组
    if(unit.feeling=="free")//自由行动时
    {
        var obj_part=arr_part[unit.partx][unit.partz];
        //遍历所有和自己处于同一地块的单位，以及虽处于其他地块但影响到这一地块的单位，这里假定view为1？！
        //var arr_neighbor=obj_part.arr_unit;//单位肯定会影响自己所在的地块，所以这个其实没有用
        var dis_min=9999;
        var unit_nearest=null;

        // arr_neighbor.forEach((neighbor,i)=>{
        //     if(neighbor.id!=unit.id&&neighbor.owner!=unit.owner)
        //     {
        //         var dis=vxz.distance(unit.pos,neighbor.pos);
        //         if(dis_min>dis)
        //         {
        //             dis_min=dis;
        //             unit_nearest=neighbor;
        //         }
        //     }
        // })
        var arr_part_found=OneThink.getArrPartbyStep(obj_part,unit.view);//这个是从0层到4层的！《-可以优化
        var len =arr_part_found.length;
        for(var i=0;i<len;i+=2)
        {
            var obj1=arr_part_found[i];
            var obj2=arr_part_found[i+1];
            for(var xz in obj1)
            {
                var obj_part2=obj1[xz];
                var arr_star=obj_part2.arr_influence;
                arr_star.forEach((neighbor,j)=>{
                    if(neighbor.id!=unit.id&&neighbor.owner!=unit.owner)
                    {
                        var dis=vxz.distance(unit.pos,neighbor.pos);
                        if(dis_min>dis)
                        {
                            dis_min=dis;
                            unit_nearest=neighbor;
                        }
                    }
                })
            }
            if(obj2)
            {
                for(var xz in obj2)
                {
                    var obj_part2=obj2[xz];
                    var arr_star=obj_part2.arr_influence;
                    arr_star.forEach((neighbor,j)=>{
                        if(neighbor.id!=unit.id&&neighbor.owner!=unit.owner)
                        {
                            var dis=vxz.distance(unit.pos,neighbor.pos);
                            if(dis_min>dis)
                            {
                                dis_min=dis;
                                unit_nearest=neighbor;
                            }
                        }
                    })
                }
            }
            if(unit_nearest)//如果在内层找到最近单位，就不用去外层查看了
            {
                break;
            }
        }
        // arr_part_found.forEach((obj)=>{
        //     for(var xz in obj)
        //     {
        //         var obj_part2=obj[xz];
        //         var arr_star=obj_part2.arr_influence;
        //         arr_star.forEach((neighbor,i)=>{
        //             if(neighbor.id!=unit.id&&neighbor.owner!=unit.owner)
        //             {
        //                 var dis=vxz.distance(unit.pos,neighbor.pos);
        //                 if(dis_min>dis)
        //                 {
        //                     dis_min=dis;
        //                     unit_nearest=neighbor;
        //                 }
        //             }
        //         })
        //     }
        // })


        if(unit_nearest)//如果找到了最近敌对单位
        {
            if(dis_min<unit.radius*2)//攻击行为的优先度高于移动，但如果已经在进行其他攻击行为则要等待上次完成
            {//前端的动画执行完毕，后端才扣血
                arr_command.push({func:"attack",obj_p:unit_nearest.id});
                count_a++;
            }
            else//移动到目标附近
            {

                if(unit.doing=="walking")//如果正在走，则要保证新的目标点变化很大
                {
                    if(vxz.distance(unit.last_post,unit_nearest.pos)>0.1)
                    {
                        arr_command.push({func:"move",obj_p:unit_nearest.pos})
                    }
                }
                else
                {
                    arr_command.push({func:"move",obj_p:unit_nearest.pos})
                }
                unit.last_post=unit_nearest.pos;
            }
        }
    }
    else if(unit.feeling=="commanded")
    {
        if(unit.wanting=="Attackto")//攻击移动
        {
            //先判断到没到目标位置！
            var dis=vxz.distance(unit.pos,unit.target);
            if(dis<unit.radius)//到达目标附近
            {
                unit.wanting="waiting";
                unit.feeling="free";
                return [];
            }
            //接着检查周围有无可攻击单位
            var obj_part=arr_part[unit.partx][unit.partz];
            var dis_min=9999;
            var unit_nearest=null;
            var arr_part_found=OneThink.getArrPartbyStep(obj_part,3);
            var len =arr_part_found.length;//这个要全遍历到
            for(var i=0;i<len;i+=1)
            {
                var obj1=arr_part_found[i];
                for(var xz in obj1)
                {
                    var obj_part2=obj1[xz];
                    var arr_star=obj_part2.arr_influence;
                    arr_star.forEach((neighbor,j)=>{
                        if(neighbor.id!=unit.id&&neighbor.owner!=unit.owner)
                        {
                            var dis=vxz.distance(unit.pos,neighbor.pos);
                            if(dis<unit.radius*2)//在攻击范围内
                            {
                                if(dis_min>dis)
                                {
                                    dis_min=dis;
                                    unit_nearest=neighbor;
                                }
                            }
                        }
                    })
                }
            }
            if(unit_nearest)//如果找到了最近敌对单位
            {
                    arr_command.push({func:"attack",obj_p:unit_nearest.id});
                    //count_a++;
            }
            else//移动到目标附近
            {

                if(unit.doing!="walking")//如果正在移动，则不重复命令
                {
                    arr_command.push({func:"move",obj_p:unit.target});
                }

            }
        }
        else if(unit.wanting=="Forceto"){//强制移动
            //先判断到没到目标位置！
            var dis=vxz.distance(unit.pos,unit.target);
            if(dis<unit.radius)//到达目标附近
            {
                unit.wanting="waiting";
                unit.feeling="free";
                return [];
            }
            if(unit.doing!="walking")//如果正在移动，则不重复命令
            {
                arr_command.push({func:"move",obj_p:unit.target});
            }
        }
    }
    return arr_command;

}

OneThink.do=function(one)
{

}
OneThink.reflect=function(one)
{

}


//寻找地块应该是直接遍历空间内的所有地块索引，还是根据规则从起点地块一圈一圈查找？
//这取决于一个线程能够负担多少单位的计算，假设一个地块平均保有100个单位，估计一个线程最多负责计算10000个单位，也就是最多可能有100个地块，10*10排列，最大步数不超过20
//根据步数寻找单位一定范围内的地块
OneThink.getArrPartbyStep=function(obj_part,step_influence)
{
    var arr_part_found=[];
    //var depth=0;
    for(var i=0;i<step_influence;i++)
    {
        arr_part_found.push({});
    }
    OneThink.getArrPartbyStep2(obj_part,step_influence,'o',0,arr_part_found);

    return arr_part_found;
}
OneThink.arr_direction=[0,1,2,3]//[东南北西]这样相反的方向相加结果都是3！//["west","north","east","south"];//{"west":0,"north":1,"east":2,"south":3,"o":999}//
OneThink.getArrPartbyStep2=function(obj_part,step_influence,from,depth,arr_part_found)
{
    if(depth<step_influence)
    {
        // var index_from=arr_direction[from];
        // for(var to in arr_direction)
        // {
        //     if(to!=from)
        //     {
        //         if(obj_part[to])
        //         {
        //             arr_part_found[depth].push(obj_part[to]);
        //             var int_temp=Math.abs(index_from-arr_direction[to]);
        //             if(int_temp==2&&int_temp>900)
        //             {
        //                 depth+=2
        //             }
        //         }
        //     }
        // }
        OneThink.arr_direction.forEach((to,index)=>{
            if((to+from)!=3||from=="o")//比如从左向右进入下一个地块，则下一个地块不应重复检测自身的西方，而从起点出发时要检测所有方向
            {
                var obj_part2=obj_part[to];
                if(obj_part2)
                {
                    if(!arr_part_found[depth][obj_part2.partx+"_"+obj_part2.partz])//每个地块只添加一次
                    {
                        arr_part_found[depth][obj_part2.partx+"_"+obj_part2.partz]=(obj_part2);
                        //depth+=1;
                        OneThink.getArrPartbyStep2(obj_part2,step_influence,to,depth+1,arr_part_found);
                    }

                }
            }
        })


    }

}
