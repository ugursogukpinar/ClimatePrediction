
function kMeans(kmeansData, clusterCount) {
	normalizedData = normalizeData(kmeansData);
	kmeansData = normalizedData['data'];


	var iterateCount = 1000;
	var centers = generateCentersFromData(kmeansData, clusterCount);
	var centerInstances;

	centerInstances = iterateData(kmeansData, centers, clusterCount)

	for (var i = 0; i < iterateCount - 1; i++) {
		centers = calculateCenters(centerInstances, clusterCount);
		centerInstances = iterateData(kmeansData, centers, clusterCount);
	}
	return {
		'centers': centers,
		'centerInstances': centerInstances,
		'minAndMax': normalizedData['minAndMax']
	}
}

function calculateCenters(centerInstances, clusterCount) {
	centers = [];

	centerInstances.forEach(function(instances, centerIndex){
		centers.push([]);

		for (var attributeIndex = 0; attributeIndex < instances[0].attributes.length; attributeIndex++) {
			var attributeAvg = 0;
			for (var instanceIndex = 0; instanceIndex < instances.length; instanceIndex++) {
				attributeAvg += instances[instanceIndex].attributes[attributeIndex];
			}
			attributeAvg /= instances.length;

			centers[centerIndex].push(attributeAvg);
		}
	});

	return centers;
}

function iterateData(kmeansData, centers, clusterCount) {
	var centerInstances = [];

	for (i=0;i < clusterCount; i++) {
		centerInstances.push([]);
	}

	Object.keys(kmeansData).forEach(function(instance_key){
		var instance = kmeansData[instance_key];
		var minDistance = 999999;
		var minIndex = -1;

		centers.forEach(function(center, index){
			var centerDistance = 0;

			center.forEach(function(attribute, attributeIndex){
				centerDistance += Math.pow(attribute - instance[attributeIndex], 2);
			});

			centerDistance = Math.pow(centerDistance, 0.5);

			if (centerDistance < minDistance) {
				minDistance = centerDistance;
				minIndex = index;
			}
		});

		centerInstances[minIndex].push({
			'attributes': instance,
			'key': instance_key
		});
	});

	return centerInstances;
}


function generateCentersFromData(trainData, clusterCount) {
	instance_keys = Object.keys(trainData);
	centers = [];

	for (var i = 0; i < clusterCount; i++) {
		var random_key = instance_keys[Math.floor(Math.random()*instance_keys.length)];
		centers.push(trainData[random_key]);
	}

	return centers;
}

function normalizeData(kmeansData) {
	var columns = [];
	var instanceKeys = Object.keys(kmeansData);
	var attributeLength = kmeansData[instanceKeys[0]].length
	var minAndMax = [];

	for (var i = 0; i < attributeLength; i++) {
		columns.push([]);

		instanceKeys.forEach(function(key){
			columns[i].push(kmeansData[key][i])
		});
	}

	for (var i = 0; i < columns.length; i++) {
		columns[i].sort(function(a,b){
			return a-b;
		});

		minAndMax.push([columns[i][0],columns[i][instanceKeys.length - 1]]);
	}

	instanceKeys.forEach(function(key){
		for (var i = 0; i < attributeLength; i++) {
			kmeansData[key][i] = (kmeansData[key][i] - minAndMax[i][0]) / (minAndMax[i][1] - minAndMax[i][0])
		}
	});

	return {
		'data': kmeansData,
		'minAndMax': minAndMax
	};
}

