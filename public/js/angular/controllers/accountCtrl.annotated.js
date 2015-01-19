var accountCtrl = app.controller('accountCtrl', ['$scope', '$upload', '$http', '$location', 'user', 'flash', '$cookieStore', function($scope, $upload, $http, $location, user, flash, $cookieStore) {

    $scope.user = user;
    if ($scope.user.picture == "") {
        $scope.user.picture = '/img/generic_avatar.gif';
    }

    $scope.dropSupported = true;
    $scope.disabled = undefined;
    $scope.excommTitles = {"president":"President", "vpfinance":"VP Finance", "vplossprevention": "VP Loss Prevention",
        "vpmembereducation":"VP Member Education", "vpmembereducationtwo":"VP Member Education Two", "vpacademicexcellence":"VP Academic Excellence",
        "vpadministration": "VP Administration", "houseimprovementchair":"House Improvement Chair",
        "vpexternalrelations": "VP External Relations", "internalsocialchair": "Internal Social Chair",
        "associatemembereducator": "Associate Member Educator"};

    $scope.statusSelect = {
        isopen: false
    };

    $scope.statuses = ['Active', 'Alumni', 'Pledge'];
    $scope.posSelect = {
        isopen: false
    };
    $scope.addresses = [];
    $scope.address = {};
    $scope.formData = {};
    $scope.takenPositions = [];


    $scope.refreshAddresses = function(address) {
        var params = {address: address, sensor: false};
        return $http.get(
            'http://maps.googleapis.com/maps/api/geocode/json?',
            {params: params}
        ).then(function(response) {
                $scope.addresses = response.data.results;
            });
    };

    $scope.updateProfile = function() {
        if ($cookieStore.get('jwt') !== null) {
            user.address = $scope.address.selected.formatted_address;
            console.log(user);
            $http.post('/api/userprofile', {data: user})
                .success(function(response) {
                    console.log(response);
                    flash.success = 'Profile saved.';
                    console.log(flash.success);
                })
                .error(function () {
                    flash.error = 'Something went wrong.';
                });
        } else {
            $location.path('/login');
        }
    };

    $scope.onFileSelect = function($files) {
        //$files: an array of files selected, each file has name, size, and type.
        for (var i = 0; i < $files.length; i++) {
            var file = $files[i];
            $scope.upload = $upload.upload({
                url: '/api/userpicture', //upload.php script, node.js route, or servlet url
                method: 'POST',
//                headers: {'x-csrf-token': $scope.user.csrf},
                // withCredentials: true,
                //data: {_csrf: $scope.user.csrf},
                file: file // or list of files ($files) for html5 only
                //fileName: user.email + '.jpg' // to modify the name of the file(s)
                // customize file formData name ('Content-Disposition'), server side file variable name.
                //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                //formDataAppender: function(formData, key, val){}
            }).progress(function(evt) {
//                console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
            }).success(function(data, status, headers, config) {
                // file is uploaded successfully
                console.log(data);
                $scope.user.picture = data.picture;
            });
            //.error(...)
            //.then(success, error, progress);
            // access or attach event listeners to the underlying XMLHttpRequest.
            //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        }
        /* alternative way of uploading, send the file binary with the file's content-type.
         Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
         It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
    };
}]);