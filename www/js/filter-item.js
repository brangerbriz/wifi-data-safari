Vue.component('filter-item', {
    props:{
        DataNfo:Object
    },
    methods:{
        removeFilt:function(type){
            this.$emit('rmvfilt',type)
        },
        translate:function(filt){
            let t = filt.type
            let d = filt.data
            if( t=='randomMac' ){
                t = 'MAC'
                d = d ? 'randomized' : 'unique'
            }
            if( d=='station' ) d = 'device'
            return `${t}: ${d}`
        }
    },
    template:`<div>
        <span style="cursor:pointer" v-on:click="removeFilt(DataNfo.type)">
            [X] </span> {{ translate(DataNfo) }}
    </div>`
})
