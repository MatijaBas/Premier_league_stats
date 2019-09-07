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
        }
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

    dc.renderAll();
}


// Refresh Page Function
function refreshPage() {
    window.location.reload();
}

// function makeGraphs(error, pl_statsData) {
    //     var ndx = crossfilter(pl_statsData);
    //     var team_dim = ndx.dimension(dc.pluck('team'));
    //     var total_wins_per_club = team_dim.group().reduceSum(dc.pluck('wins'));
    //     dc.pieChart('#wins-per-club')
    //         .height(330)
    //         .radius(90)
    //         .transitionDuration(1500)
    //         .dimension(team_dim)
    //         .group(total_wins_per_club);
    // }
