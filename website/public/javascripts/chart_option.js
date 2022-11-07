let poll_select;
let graph_canvas;
let guild_id;
let chart = null;

// config
const data = {
    labels: [],
    datasets: [{
        label: 'Temp Title',
        data: [],
        backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(175, 225, 175)'
        ],
        hoverOffset: 4
    }]
};

const config = {
    type: 'pie',
    data: data
};

// helper functions

async function UpdateChart(){
    // ignore if no options
    console.log(poll_select);
    if(poll_select[0].options.length <= 0 ){
        return;
    }
    // get poll name
    const poll_name = poll_select.val();
    // get poll data
    $.get("/server_info/poll_data", {guild_id:guild_id, poll_name:poll_name}, function(resdata, status) {
        if(status != "success"){
            console.log(`ERROR: ${status}`);
            return;
        }
        console.log(JSON.stringify(resdata));
        // update data
        data.labels = resdata.poll_option_names;
        data.datasets[0].data = resdata.poll_results;
        // update chart
        if(chart == null){
            chart = new Chart(graph_canvas, config);
        }
        else{
            chart.update();
        }
    });
}

// event listener

window.onload = function() {
    poll_select = $('#poll_select');
    graph_canvas = $('#poll_graph_display');
    guild_id = $('#guild_id_holder').attr('value');
    (async () => {UpdateChart();})();
}