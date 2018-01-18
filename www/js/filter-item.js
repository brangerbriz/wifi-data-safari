Vue.component('filter-item', {
    props:{
        DataNfo:Object
    },
    methods:{
        removeFilt:function(type){
            this.$emit('rmvfilt',type)
        }
    },
    template:`<div>
        <span style="cursor:pointer" v-on:click="removeFilt(DataNfo.type)">
            [X] </span>
        {{ DataNfo.type }}: {{ DataNfo.data }}
    </div>`
})
