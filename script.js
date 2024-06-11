
var map = L.map('map').setView([39.159, -98.38], 4);
var basemap =L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(map)

//add more info to this?
function bindPopups(feature, layer){
    if(feature.properties && feature.properties["Program Name"]){
        layer.bindPopup(feature.properties["Program Name"])
    }
}

var projectsByDept = []

function getColorIcon(color){
    return new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-'+color+'.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    })
}

var layerControl;

var colors = ['green', 'blue', 'gold', 'red', 'violet', 'orange']
var labelColors = ["#2AAD27", "#2A81CB", "#FFD326", "#CB2B3E", "#9C2BCB", "#CB8427"]

function onMarkerClick(e){
    //console.log(e.sourceTarget)
    dept = document.getElementById("Department")
    dept.innerHTML = "<b>Department</b>: <br>"+e.sourceTarget.feature.properties["Department"]
    area = document.getElementById("Area")
    area.innerHTML = "<b>Area</b>: <br>"+e.sourceTarget.feature.properties["Area"]
    agency = document.getElementById("Agency/Collaborator")
    agency.innerHTML = "<b>Agency/Collaborator</b>: <br>"+e.sourceTarget.feature.properties["Agency/Collaborator"]
    stat = document.getElementById("Project Status")
    stat.innerHTML = "<b>Project Status</b>: <br>"+e.sourceTarget.feature.properties["Project Status"]

    if(e.sourceTarget.feature.properties["Writeup"]){
        writeup = document.getElementById("writeup")
        writeup.innerHTML = "<b>Project Summary: <br></b>"+e.sourceTarget.feature.properties["Writeup"]
    }

    //update current project
    id = e.sourceTarget._leaflet_id
    for(i = 0; i < projectsOnMap; i++){
        if(markerClusters.getLayers()[i]._leaflet_id == id){
            currentProject = i+1
            updateCounter()
            return
        }
    }
}
//reset text boxes
function onPopupClose(e){
    dept = document.getElementById("Department")
    area = document.getElementById("Area")
    agency = document.getElementById("Agency/Collaborator")
    stat = document.getElementById("Project Status")
    writeup = document.getElementById("writeup")

    dept.innerHTML = "<b>Department: </b>"
    area.innerHTML = "<b>Area: </b>"
    agency.innerHTML = "<b>Agency/Collaborator: </b>"
    stat.innerHTML = "<b>Project Status: </b>"
    writeup.innerHTML = "<b>Project Summary:</b> "

    document.getElementById("counter").innerHTML = ""

}

var markerClusters = L.markerClusterGroup({ maxClusterRadius: 30}).addTo(map);


let projectsOnMap = 0 

let currentProject = 0
var overlayMaps = {}

var projectsByArea = {
    'label': 'Projects',
    'selectAllCheckbox': true,
    'children': []
}
var controlTest = []

filenames = []

//main processing function
function fetchData(){
    $.getJSON('./projects', data => {
        filenames = data; //read names of departments into array for processing
        var obj = {}
        var i = filenames.length-1;
        for(i = 0; i < filenames.length; i++){
            obj[filenames[i].split(".")[0]] = colors[i]
            //console.log(obj)
            filename = "projects/"+filenames[i]
            projectsByDept[i] = new L.GeoJSON.AJAX(filename, {
                onEachFeature: bindPopups,
                pointToLayer: function(feature, latlng){
                    marker = L.marker(latlng, {icon: getColorIcon(obj[feature.properties["Department"]])}).on('click', onMarkerClick).on('popupclose', onPopupClose)
                    return marker
                }
            })
           
        }
        console.log(projectsByDept)
        //once the last layer has loaded, start processing
        projectsByDept[i-1].on('data:loaded', function(){
            console.log(Object.keys(projectsByDept[i-1]._layers))
            //var markerClusters = L.markerClusterGroup({ maxClusterRadius: 30}).addTo(map);

            var dummyLayers = []
            for(i = 0; i < filenames.length; i++){
                dummyLayers.push(L.marker([0,0]).setOpacity(0))
            }


            for(i = 0; i < filenames.length; i++){
                layerName = filenames[i].split(".")[0]
                overlayMaps[layerName] = dummyLayers[i]
            }

            //console.log(overlayMaps)

            //need to split each layer into subcategories based on "Area"
            //confusing but I think this works mostly right
            for(i = 0; i < filenames.length; i++){
                department = filenames[i].split(".")[0]
                projectsByArea.children.push({label:department, children:[], 'selectAllCheckbox': true, "collapsed":true})
                dept_layers = projectsByDept[i]._layers
                dept_keys = Object.keys(dept_layers)
                projectAreas = []
                areaObj = {}
                for(j = 0; j < dept_keys.length; j++){
                    area = dept_layers[dept_keys[j]].feature.properties.Area
                    if(!projectAreas.includes(area)){
                        projectAreas.push(area)
                        projectsByArea.children[i].children.push({label:area, 'selectAllCheckbox': true, children:[], "collapsed":true})
                    }
                    //https://stackoverflow.com/questions/7176908/how-can-i-get-the-index-of-an-object-by-its-property-in-javascript
                    index = projectsByArea.children[i].children.map(e => e.label).indexOf(area)
                    projectsByArea.children[i].children[index].children.push({label:dept_layers[dept_keys[j]]._popup._content , layer:dept_layers[dept_keys[j]]})
                }
            }  
            console.log(projectsByArea)
            

            var overlaysTree = {
                label: 'Points of Interest',
                selectAllCheckbox: 'Un/select all',
                children: [
                {
                    label: 'Europe',
                    selectAllCheckbox: true,
                    children: [
                        {
                            label: 'France',
                            selectAllCheckbox: true,
                            children: [
                                { label: 'Tour Eiffel', layer: L.marker([48.8582441, 2.2944775]) },
                                { label: 'Notre Dame', layer: L.marker([48.8529540, 2.3498726]) },
                                { label: 'Louvre', layer: L.marker([48.8605847, 2.3376267]) },
                            ]
                        }, {
                            label: 'Germany',
                            selectAllCheckbox: true,
                            children: [
                                { label: 'Branderburger Tor', layer: L.marker([52.5162542, 13.3776805])},
                                { label: 'Kölner Dom', layer: L.marker([50.9413240, 6.9581201])},
                            ]
                        }, {label: 'Spain',
                            selectAllCheckbox: 'De/seleccionar todo',
                            children: [
                                { label: 'Palacio Real', layer: L.marker([40.4184145, -3.7137051])},
                                { label: 'La Alhambra', layer: L.marker([37.1767829, -3.5892795])},
                            ]
                        }
                    ]
                }, {
                    label: 'Asia',
                    selectAllCheckbox: true,
                    children: [
                        {
                            label: 'Jordan',
                            selectAllCheckbox: true,
                            children: [
                                { label: 'Petra', layer: L.marker([30.3292215, 35.4432464]) },
                                { label: 'Wadi Rum', layer: L.marker([29.6233486, 35.4390656]) }
                            ]
                        }
                    ]
                }
            ]}
            //console.log(overlaysTree)

            // controlTest = L.control.layers.tree(null, projectsByArea, {collapsed : false, position: 'bottomleft', "labelIsSelector":'both'})
            // controlTest.addTo(map)
            layerControl = L.control.layers(null, overlayMaps, {collapsed : false, position: 'topright'})
            layerControl.addTo(map)

            //let's try to assign colors to legend?
            labels = document.getElementsByClassName("leaflet-control-layers-overlays")[0].children 
            for(i = 0; i < labels.length; i++){
                labels[i].style.color = labelColors[i]
            }


            map.on('overlayadd', function(e){
                if(e.name == "Current"){
                    //get names of checked layers
                    checked = []
                    for(i = 0; i < projectsByDept.length; i++){
                        if(layerControl._layerControlInputs[i].checked){
                            //this is a hack but I think it works
                            //checked.push(projectsByDept[i].urls[0].split(/\W+/)[1])
                            keys = Object.keys(projectsByDept[i]._layers)
                            for(j = 0; j < keys.length; j++){
                                if(projectsByDept[i]._layers[keys[j]].feature.properties["Project Status"]=="Current"){
                                    markerClusters.addLayer(projectsByDept[i]._layers[keys[j]])
                                }
                            }
                        }
                    }

                }
                else if(e.name == "Past"){
                    for(i = 0; i < projectsByDept.length; i++){
                        if(layerControl._layerControlInputs[i].checked){
                            keys = Object.keys(projectsByDept[i]._layers)
                            for(j = 0; j < keys.length; j++){
                                if(projectsByDept[i]._layers[keys[j]].feature.properties["Project Status"]=="Past"){
                                    markerClusters.addLayer(projectsByDept[i]._layers[keys[j]])
                                }
                            }
                        }
                    }
                }
                else{
                    console.log(e)
                    index = filenames.indexOf(e.name+".geojson")
                    markerClusters.addLayer(projectsByDept[index])
                }
                projectsOnMap = markerClusters.getLayers().length
                updateCounter()

            });

            map.on('overlayremove', function(e){
                if(e.name == "Current"){
                    layers = markerClusters.getLayers()
                    for(i = 0; i < layers.length; i++){
                        if(layers[i].feature.properties["Project Status"]=="Current"){
                            markerClusters.removeLayer(layers[i])
                        }
                    }
                }
                else if(e.name == "Past"){
                    layers = markerClusters.getLayers()
                    for(i = 0; i < layers.length; i++){
                        if(layers[i].feature.properties["Project Status"]=="Past"){
                            markerClusters.removeLayer(layers[i])
                        }
                    }
                }
                else{
                    index = filenames.indexOf(e.name+".geojson")
                    markerClusters.removeLayer(projectsByDept[index])
                }
                projectsOnMap = markerClusters.getLayers().length
                updateCounter()

            });
        })
    })

}

fetchData()


//these two are pretty complicated but I think they're working mostly right?
function prevProject(){
    layers = markerClusters.getLayers()
    //console.log(markerClusters)
    for(i = 0; i < layers.length; i++){
        if(layers[i].isPopupOpen()){
            //console.log(layers[i])
            if(i-1>=0){
                map.closePopup();
                currentProject = i
                updateCounter()
                //need to implement handling of markers that are inside a cluster
                //check if the map has the layer - if not, then it's in a cluster
                if(!map.hasLayer(layers[i-1])){
                    parent = layers[i-1].__parent
                    //this is still a bit buggy
                    if(parent._zoom<=map._zoom){
                        map.setView(layers[i-1]._latlng)
                        if(map._layers[parent._leaflet_id]){
                            map._layers[parent._leaflet_id]._icon.click()
                            updateText(layers[i-1])
                            setTimeout(() => {
                                layers[i-1].openPopup()
                            }, "500");
                        }else{
                            updateText(layers[i-1])
                            layers[i-1].openPopup()
                        }                        
                    }
                    else{
                        while(parent._zoom != map._zoom){
                            parent = parent.__parent
                        }
                        //check if the parent is on the map - if not, then just zoom to layer?
                        if(!map._layers[parent._leaflet_id]){
                            map.setView(layers[i-1]._latlng)
                            if(map._layers[parent._leaflet_id]){
                                map._layers[parent._leaflet_id]._icon.click()
                            }
                        }
                        else{
                            map._layers[parent._leaflet_id]._icon.click()
                        }
                        updateText(layers[i-1])
                        setTimeout(() => {
                            layers[i-1].openPopup()
                        }, "500");
                    }
                }
                else{
                    layers[i-1].openPopup()
                    updateText(layers[i-1])
                }
                return 
            }
            else{
                //implement looping around the other side of array?
            }
        }
    }
}

function nextProject(){
    layers = markerClusters.getLayers()
    //console.log(markerClusters)
    for(i = 0; i < layers.length; i++){
        if(layers[i].isPopupOpen()){
            //console.log(layers[i])
            if(i+1<layers.length){
                //console.log(layers[i+1])
                map.closePopup();
                currentProject = i+2
                updateCounter()
                //need to implement handling of markers that are inside a cluster
                //check if the map has the layer - if not, then it's in a cluster
                if(!map.hasLayer(layers[i+1])){
                    parent = layers[i+1].__parent
                    //this is still a bit buggy
                    if(parent._zoom<=map._zoom){
                        map.setView(layers[i+1]._latlng)
                        if(map._layers[parent._leaflet_id]){
                            map._layers[parent._leaflet_id]._icon.click()
                            updateText(layers[i+1])
                            setTimeout(() => {
                                layers[i+1].openPopup()
                            }, "500");
                        }else{
                            updateText(layers[i-1])
                            layers[i+1].openPopup()
                        }                        
                    }
                    else{
                        while(parent._zoom != map._zoom){
                            parent = parent.__parent
                        }
                        //check if the parent is on the map - if not, then just zoom to layer?
                        if(!map._layers[parent._leaflet_id]){
                            map.setView(layers[i+1]._latlng)
                            if(map._layers[parent._leaflet_id]){
                                map._layers[parent._leaflet_id]._icon.click()
                            }
                        }
                        else{
                            map._layers[parent._leaflet_id]._icon.click()
                        }
                        updateText(layers[i+1])
                        setTimeout(() => {
                            layers[i+1].openPopup()
                        }, "500");
                    }
                }
                else{
                    layers[i+1].openPopup()
                    updateText(layers[i+1])
                }
                return
            }
            else{
                //implement looping around the other side of array?
                
            }
        }
    }
}


function updateCounter(){
    counter = document.getElementById("counter")
    if(projectsOnMap>0){
        counter.innerHTML = "(Project "+currentProject+" of "+projectsOnMap +")"
    }
    else{
        counter.innerHTML = ""
    }
}


//current/past control setup
var cp_dummyLayers = [L.marker([0,0]).setOpacity(0), L.marker([0,0]).setOpacity(0)]
var cp_overlayMaps = {}

cp_overlayMaps["Current"] = cp_dummyLayers[0]
cp_overlayMaps["Past"] = cp_dummyLayers[1]

var current_past_control =  L.control.layers(null, cp_overlayMaps, {collapsed : false, position: 'bottomright'})

current_past_control.addTo(map)
cp_dummyLayers[0].addTo(map)
cp_dummyLayers[1].addTo(map)
