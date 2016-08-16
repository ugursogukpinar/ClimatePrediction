var centers;
var centerAvg;
var minAndMax;

$(function () { 
	var trainData = {};
	var kMeansData = {};
	var cities = [];

	$.ajax({
		'url': 'train.json',
		'type': 'GET',
		'dataType': 'JSON',
		'success': function(result) {
			result.forEach(function(city){
				$('#cities').append('<option value="'+ city['SEHIR'] +'">'+ city['SEHIR'] +'</option>');

				trainData[city['SEHIR']] = {
					'attributes': {
						'LAT': city['LAT'],
						'LNG': city['LNG'],
						'FOREST_RATION': city['ORMAN_ORANI'],
						'ALTITUDE': city['RAKIM']
					}
				};

				types.forEach(function(type){
					if (!trainData[city['SEHIR']].hasOwnProperty(type)) {
						trainData[city['SEHIR']][type] = [];
					}

					months.forEach(function(month){
						var key = month + '_' + type;
						trainData[city['SEHIR']][type].push(city[key])
					});
				});

				kMeansData[city['SEHIR']] = [city['LAT'],city['ORMAN_ORANI'],city['RAKIM']]
			});

			var kmeansResult = kMeans(kMeansData, 3);
			centers = kmeansResult['centers'];
			centerAvg = calculate_center_attributes(kmeansResult['centerInstances'], trainData);
			minAndMax = kmeansResult['minAndMax'];

			draw_mappoint_chart(centerAvg);
		},
		'error': function() {
			alert('Veri seti okunamadı!');
		}
	});


	$('body').on('change', '#cities', function(e){
		draw_line_chart(trainData[$(this).val()], '#chart');
	});

	$('body').on('click' ,'#find', function(e){
		e.preventDefault();

		var attributes = [
			parseFloat($('#latitude').val()),
			parseFloat($('#forest-ratio').val()),
			parseFloat($('#altitude').val())
		]

		attributes.forEach(function(attribute, index){
			attributes[index] = (attributes[index] - minAndMax[index][0]) / (minAndMax[index][1]-minAndMax[index][0]);
		});

		var closestCenter = findClosestCenter(attributes);
		draw_line_chart(centerAvg[closestCenter], '#closestCenterChart', 'C_ ' + closestCenter);

	});
});


function draw_line_chart(data, selector, title) {

	if (typeof title == 'undefined') {
		title = '';
	}

	$(selector).html('');

	var series = [];

	types.forEach(function(key){
		series.push({
			'name': key,
			'data': data[key]
		});
	});

	$(selector).highcharts({
        chart: {
            type: 'line',
            width: 1100
        },
        title: {
            text: title
        },
        xAxis: {
            categories: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        series: series
    });
}

function draw_mappoint_chart(centers) {
	var data = [];

	centers.forEach(function(center, index){
		data.push({
			'name': 'C_' + index,
			'lat': center.attributes.LAT,
			'lon': center.attributes.LNG
		});
	});

	$('#mapchart').html('');

	$('#mapchart').highcharts('Map', {
        title: {
            text: ''
        },

        mapNavigation: {
            enabled: true
        },

        tooltip: {
            headerFormat: '',
            pointFormat: '<b>{point.name}</b><br>Lat: {point.lat}, Lon: {point.lon}'
        },

        series: [{
            // Use the gb-all map with no data as a basemap
            mapData: Highcharts.maps['countries/tr/tr-all'],
            name: 'Basemap',
            borderColor: '#A0A0A0',
            nullColor: 'rgba(200, 200, 200, 0.3)',
            showInLegend: false
        }, {
            name: 'Separators',
            type: 'mapline',
            data: Highcharts.geojson(Highcharts.maps['countries/tr/tr-all'], 'mapline'),
            color: '#707070',
            showInLegend: false,
            enableMouseTracking: false
        }, {
            // Specify points using lat/lon
            type: 'mappoint',
            name: 'Centers',
            color: Highcharts.getOptions().colors[1],
            data: data
        }]
    });
}

function calculate_center_attributes(centerInstances, trainData) {
	var centerAvg = [];

	centerInstances.forEach(function(instances, centerIndex){
		centerAvg.push({
			'attributes': {
				'LAT': 0,
				'LNG': 0
			},
		});

		types.forEach(function(type){
			centerAvg[centerIndex][type] = [];

			months.forEach(function(month, monthIndex){
				centerAvg[centerIndex][type][monthIndex] = 0;

				instances.forEach(function(instance){
					centerAvg[centerIndex][type][monthIndex] += trainData[instance.key][type][monthIndex];
				});

				centerAvg[centerIndex][type][monthIndex] /= instances.length;
			});
		
		});

		instances.forEach(function(instance){
			centerAvg[centerIndex]['attributes']['LAT'] += trainData[instance.key]['attributes']['LAT'];
			centerAvg[centerIndex]['attributes']['LNG'] += trainData[instance.key]['attributes']['LNG'];
		});

		centerAvg[centerIndex]['attributes']['LAT'] /= instances.length;
		centerAvg[centerIndex]['attributes']['LNG'] /= instances.length;
	});

	return centerAvg;
}


function findClosestCenter(attributes) {
	var minCenterIndex = -1;
	var minCenterDistance = 1000;

	centers.forEach(function(center, centerIndex){
		var distance = 0;
		attributes.forEach(function(attribute, attributeIndex){
			distance += Math.pow(attribute - center[attributeIndex], 2);
		});

		distance = Math.pow(distance, 0.5);

		if (distance < minCenterDistance) {
			minCenterDistance = distance;
			minCenterIndex = centerIndex;
		}
	});

	return minCenterIndex;
}

