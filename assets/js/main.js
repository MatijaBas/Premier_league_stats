queue()
    .defer(d3.json, "data/pl_stats.json")
    .await(makeGraphs);

function makeGraphs(error, pl_statsData) {
    // Wins per club
    var ndx = crossfilter(pl_statsData);
    var team_dim = ndx.dimension(dc.pluck('team'));
    var total_wins_per_club = team_dim.group().reduceSum(dc.pluck('wins'));
    dc.barChart('#wins-per-club')
        .width(600)
        .height(300)
        .margins({ top: 10, right: 50, bottom: 50, left: 50 })
        .dimension(team_dim)
        .group(total_wins_per_club)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Club Name")
        .yAxis().ticks(7);

    // Losses per club
    var ndx = crossfilter(pl_statsData);
    var team_dim = ndx.dimension(dc.pluck('team'));
    var total_losses_per_club = team_dim.group().reduceSum(dc.pluck('losses'));
    dc.barChart('#losses-per-club')
        .width(600)
        .height(300)
        .margins({ top: 10, right: 50, bottom: 50, left: 50 })
        .dimension(team_dim)
        .group(total_losses_per_club)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Club Name")
        .yAxis().ticks(7);

    // Goals per season
    function show_discipline_selector(ndx) {
        var dim = ndx.dimension(dc.pluck('team'));
        var group = dim.group();

        dc.selectMenu("#select-club")
            .dimension(dim)
            .group(group);
    }

    var ndx = crossfilter(pl_statsData);
    var parseDate = d3.time.format("%Y-%Y").parse;
    pl_statsData.forEach(function(d) {
        d.season = parseDate(d.season);
    });

    var season_dim = ndx.dimension(dc.pluck('season'));
    var minSeason = season_dim.bottom(1)[0].season;
    var maxSeason = season_dim.top(1)[0].season;

    function goals_per_season(team) {
        return function(d) {
            if (d.team === team) {
                return +d.goals;
            }
            else {
                return 0;
            }
        };
    }
    var arsenalGoalsPerSeason = season_dim.group().reduceSum(goals_per_season('Arsenal'));
    var liverpoolGoalsPerSeason = season_dim.group().reduceSum(goals_per_season('Liverpool'));
    var chelseaGoalsPerSeason = season_dim.group().reduceSum(goals_per_season('Chelsea'));
    var manutdGoalsPerSeason = season_dim.group().reduceSum(goals_per_season('Man Utd.'));
    var compositeChart = dc.compositeChart('#goals-per-season');

    show_discipline_selector(ndx);

    compositeChart
        .width(990)
        .height(200)
        .dimension(season_dim)
        .x(d3.time.scale().domain([minSeason, maxSeason]))
        .yAxisLabel("Goals")
        .legend(dc.legend().x(75).y(90).itemHeight(13).gap(5))
        .renderHorizontalGridLines(true)
        .compose([
            dc.lineChart(compositeChart)
            .colors('green')
            .group(arsenalGoalsPerSeason, 'Arsenal'),
            dc.lineChart(compositeChart)
            .colors('red')
            .group(liverpoolGoalsPerSeason, 'Liverpool'),
            dc.lineChart(compositeChart)
            .colors('blue')
            .group(chelseaGoalsPerSeason, 'Chelsea'),
            dc.lineChart(compositeChart)
            .colors('orange')
            .group(manutdGoalsPerSeason, 'Man Utd.')
        ])
        .brushOn(false);

    // Total spend per club

    var ndx = crossfilter(pl_statsData);
    var team_dim = ndx.dimension(dc.pluck('team'));
    var total_spend_on_salarys = team_dim.group().reduceSum(dc.pluck('salarys'));
    dc.pieChart('#on-salary-spend-chart')
        .height(330)
        .radius(120)
        .transitionDuration(1500)
        .dimension(team_dim)
        .group(total_spend_on_salarys);

    var team_dim = ndx.dimension(dc.pluck('team'));
    var total_spend_on_transfers = team_dim.group().reduceSum(dc.pluck('spend_on_transfer'));
    dc.pieChart('#on-transfer-spend-chart')
        .height(330)
        .radius(120)
        .transitionDuration(1500)
        .dimension(team_dim)
        .group(total_spend_on_transfers);

    var team_dim = ndx.dimension(dc.pluck('team'));
    var total_earnings_on_transfers = team_dim.group().reduceSum(dc.pluck('transfer_earnings'));
    dc.pieChart('#on-transfer-earnings-chart')
        .height(330)
        .radius(120)
        .transitionDuration(1500)
        .dimension(team_dim)
        .group(total_earnings_on_transfers);




    dc.renderAll();


    /*Table to show all data that present. Next and last buttons used for scrolling through tabulated data*/
    function show_data_table(ndx) {

        var dim = ndx.dimension(function(d) { return d.dim; });

        var table = dc.dataTable("#dc-data-table") /* variable created for pagination */

            .dimension(dim)
            .group(function(d) { return ""; })
            .size(Infinity) /* Adjust amount of rows here. Use 'Infinity' to show all data */

            .columns([
                function(d) { return d.season; },
                function(d) { return d.wins; },
                function(d) { return d.losses; },
                function(d) { return d.goals; },
                function(d) { return d.salarys; },
                function(d) { return d.spend_on_transfer; },
                function(d) { return d.transfer_earnings; },
                function(d) { return d.clean_sheet; }

            ]).sortBy(function(d) {
                return d.season; /* sortBy return = d.Year will sort data by years */
            })
            .order(d3.descending) /* reinsert ; after final peice of this section */

            /* pagination */

            .on('preRender', update_offset)
            .on('preRedraw', update_offset)
            .on('pretransition', display);


        /* use odd page size to show the effect better */
        var ofs = 0,
            pag = 7;

        function update_offset() {
            var totFilteredRecs = ndx.groupAll().value();
            var end = ofs + pag > totFilteredRecs ? totFilteredRecs : ofs + pag;
            ofs = ofs >= totFilteredRecs ? Math.floor((totFilteredRecs - 1) / pag) * pag : ofs;
            ofs = ofs < 0 ? 0 : ofs;
            table.beginSlice(ofs); /*table used as variable for dc.dataTable("#dc-data-table") */
            table.endSlice(ofs + pag); /*table used as variable for dc.dataTable("#dc-data-table")*/
        }

        function display() {
            var totFilteredRecs = ndx.groupAll().value();
            var end = ofs + pag > totFilteredRecs ? totFilteredRecs : ofs + pag;
            d3.select('#begin')
                .text(end === 0 ? ofs : ofs + 1);
            d3.select('#end')
                .text(end);
            d3.select('#last')
                .attr('disabled', ofs - pag < 0 ? 'true' : null);
            d3.select('#next')
                .attr('disabled', ofs + pag >= totFilteredRecs ? 'true' : null);
            d3.select('#size').text(totFilteredRecs);
            if (totFilteredRecs != ndx.size()) {
                d3.select('#totalsize').text("(filtered Total: " + ndx.size() + " )");
            }
            else {
                d3.select('#totalsize').text('');
            }
        }

        $('#next').on('click', function() {
            ofs += pag;
            update_offset();
            table.redraw();
        });
        /* Event Listener function that fires when "next" HTML btn is clicked */


        $('#last').on('click', function() {
            ofs -= pag;
            update_offset();
            table.redraw();
        });
        /* Event Listener function that fires when "last" HTML btn is clicked */

    }





}

// Refresh Page Function
function refreshPage() {
    window.location.reload();

}
