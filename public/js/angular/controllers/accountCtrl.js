var accountCtrl = app.controller('accountCtrl', function($scope, $upload, $http, $location, me, flash, $cookieStore, principal, siteSocket) {

    $scope.me = me;
    $scope.me.selectedClasses = [];

    $scope.allClasses = [];
    $scope.loadingClasses = [{departmentCode: 'Loading classes...', courseNumber: ''}];

    for (var i in me.classes) {
        var temp = me.classes[i];
        var newClass = {
            departmentCode: temp.substring(0, temp.lastIndexOf(' ')),
            courseNumber : temp.substring(temp.lastIndexOf(' ') + 1)
        };
        $scope.allClasses.push(newClass);
        $scope.me.selectedClasses.push(newClass);
    }
    $scope.origMe = angular.copy($scope.me);
    $scope.initialComparison = !angular.equals($scope.me, $scope.origMe);
    $scope.dataHasChanged = angular.copy($scope.initialComparison);

    $scope.dropSupported = true;
    $scope.disabled = undefined;

    $scope.search = "";

    $scope.$watch('me', function(newval, oldval) {
       if (newval != oldval) {
           $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
       }
    }, true);

    $scope.getClasses = function(search) {
            if (search.length > 1) {
                $scope.search = search;
                var date = new Date();
                var term = 'Spring';
                var regExp = /([^\d\s]+)\s*(\d{0,3}\D{0,2})/;
                var match = regExp.exec(search);
                if (date.getMonth() > 5 || date.getMonth() == 5 && date.getDate() > 20) {
                    if (date.getMonth() > 8 || date.getMonth() == 8 && date.getDate() > 15) {
                        term = 'Fall';
                    } else {
                        term = 'Summer';
                    }
                }
                if (match) {
                    var params = match[2] ? {_type: 'json', departmentCode: match[1], courseNumber: match[2]} : {_type: 'json', departmentCode: match[1]};

                    $http({
                        url: 'https://apis-dev.berkeley.edu/cxf/asws/course',
                        method: 'GET',
                        headers: {
                            app_key: '2c132785f8434f0e6b3a49c28895645f',
                            app_id: '2e2a3e6e'
                        },
                        params: params
                    }).then(function(response) {

                        //prevent previous network resolutions from overwriting newer ones (async issue)
                        match = regExp.exec($scope.search);
                        var temp = response.data.CanonicalCourse[0];
                        if (match && temp && temp.departmentCode && temp.courseNumber) {
                            if (temp.departmentCode.indexOf(match[1]) > -1 || ('' + temp.courseNumber).indexOf(match[2]) > -1) {
                                $scope.allClasses = response.data.CanonicalCourse.concat($scope.me.selectedClasses);
                            }
                        }

                    }, function(err) {

                    })
                }

            } else {
                $scope.allClasses = $scope.me.selectedClasses;
            }

    };

    $scope.deletePicture = function() {
        $http({
            url: '/api/user/deletepicture',
            method: 'GET'
        }).success(function(data) {
            $scope.origMe.picture = data.picture;
            $scope.me.picture = data.picture;
            $scope.dataHasChanged = angular.equals($scope.me, $scope.origMe);
        }).error(function(err) {
            flash.err = err;
        });
    };

    $scope.resetSearchInput = function($select) {
        $select.search = "";
        $scope.search = "";
    };


    $scope.processForm = function() {
        $scope.me.classes = [];
        for (var c in $scope.me.selectedClasses) {
            var temp = $scope.me.selectedClasses[c];
            $scope.me.classes.push(temp.departmentCode + ' ' + temp.courseNumber);
        }
        $http.post('/api/userprofile', {data: $scope.me})
            .success(function(response) {
                if ($scope.origMe.status != $scope.me.status) {
                    siteSocket.emit('update:status', {userId: $scope.me._id, status: $scope.me.status, statusCreated: Date.now()})
                }
                $scope.origMe = angular.copy($scope.me);
                $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
                principal.updateIdentity($scope.me);
                flash.success = 'Profile saved.';

            })
            .error(function () {
                flash.error = 'Profile could not be saved. Please try again later.';
            });

    };


    $scope.onFileSelect = function($files) {
        //$files: an array of files selected, each file has name, size, and type.
        for (var i = 0; i < $files.length; i++) {
            var file = $files[i];
            $scope.upload = $upload.upload({
                url: '/api/userpicture', //upload.php script, node.js route, or servlet url
                method: 'POST',
//                headers: {'x-csrf-token': $scope.me.csrf},
                // withCredentials: true,
                //data: {_csrf: $scope.me.csrf},
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
                $scope.me.picture = data.picture;
                $scope.origMe = angular.copy($scope.me);
                $scope.dataHasChanged = !angular.equals($scope.me, $scope.origMe);
                flash.success = 'Picture successfully uploaded.';
            })
            .error(function(err) {
                    flash.error = err;
                });
            //.then(success, error, progress);
            // access or attach event listeners to the underlying XMLHttpRequest.
            //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        }
        /* alternative way of uploading, send the file binary with the file's content-type.
         Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
         It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
    };
});
