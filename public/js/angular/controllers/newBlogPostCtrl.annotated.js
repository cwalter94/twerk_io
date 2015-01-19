var newBlogPostController = app.controller('newBlogPostCtrl', ['$scope', '$http', '$upload', 'flash', '$location', function($scope, $http, $upload, flash, $location) {
    $scope.blogpost = {};

    $scope.blogpost.title = '';
    $scope.blogpost.text = '';
    $scope.user = {};
    $scope.blogpost.pictures = [];

    $scope.publish = function () {
        if (!$scope.blogpost.title || !$scope.blogpost.text) {
            flash.error = 'Please fill in ' + ($scope.blogpost.title ? ' text.' : 'title.');

        } else {
            $http.post('/api/blog/newpost', {blogpost: $scope.blogpost})
                .success(function(data) {
                    $location.path('/blog');
                })
                .error(function(err) {
                    console.log(err);
                    flash.error("An error occurred. Try again later.");
                })
        }
    };

    $scope.onFileSelect = function(file, insertAction) {
        //$files: an array of files selected, each file has name, size, and type.
        $scope.upload = $upload.upload({
            url: '/blog/picture', //upload.php script, node.js route, or servlet url
            method: 'POST',
            headers: {
                'x-csrf-token': $scope.user.csrf
            },
            //withCredentials: true,
            file: file // or list of files ($files) for html5 only
            //fileName: user.email + '.jpg' // to modify the name of the file(s)
            // customize file formData name ('Content-Disposition'), server side file variable name.
            //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
            // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
            //formDataAppender: function(formData, key, val){}
        }).progress(function(evt) {
            console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
        }).success(function(data, status, headers, config) {
            // file is uploaded successfully
            console.log(data);
            $scope.blogpost.pictures.push(data.picture);
            return true;
        })
        .error(function(data, status, headers, config) {
                console.log(data);
                console.log($scope.blogpost.text);
            });
        //.then(success, error, progress);
        // access or attach event listeners to the underlying XMLHttpRequest.
        //.xhr(function(xhr){xhr.upload.addEventListener(...)})
        };
        return true;
        /* alternative way of uploading, send the file binary with the file's content-type.
         Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
         It could also be used to monitor the progress of a normal http post/put request with large data*/
        // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
}]);