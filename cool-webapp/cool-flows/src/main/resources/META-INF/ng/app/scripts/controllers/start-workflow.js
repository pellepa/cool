'use strict';


angular.module('flowsApp')
  .controller('StartWorkflowCtrl', function ($scope, $http, $location, $routeParams, $rootScope) {

    $rootScope.home = false;

    $scope.step = 0;
    $scope.steps = ['diagramma di flusso', 'inserimento documenti principali', 'inserimento allegati', 'inserimento metadati', 'riepilogo'];


      $http({
        url: '/cool-flows/rest/common',
        method: 'GET'
      }).success(function (data) {

        var definitionId = $routeParams.id;

        $scope.common = data.User;
        $scope.workflowDefinitions = data.workflowDefinitions;

        var definitions = data.workflowDefinitions;


        //TODO: forse lo trovo anche in process ???
        var workflow = _.filter(definitions, function (definition) {
          return definition.id === definitionId;
        })[0];

        $scope.workflow = workflow;

        $scope.diagramUrl = '/cool-flows/rest/proxy?url=service/cnr/workflow/diagram.png&definitionId=' + workflow.id;

        // copiato da cool-doccnr/src/main/resources/META-INF/js/ws/workflow/main.get.js

        $http({
          url: '/cool-flows/rest/proxy?url=service/api/workflow-definitions/' + definitionId,
          method: 'GET',
        }).success(function (definition) {

          var process = definition.data;
          var processName = process.name;

          $http({
            method: 'GET',
            url: '/cool-flows/rest/bulkInfo/view/D:' + process.startTaskDefinitionType + '/form/default'
          }).success(function (form) {
            $scope.formElements = form['default'];
          });


          $scope.changeStep = function (n) {
            if (n === 4) {

              var data = {
                assoc_packageItems_added: 'workspace://SpacesStore/' + $scope.folder
              };

              _.each($scope.formElements, function (item) {
                data['prop_' + item.property.replace(':', '_')] = item['ng-value'];
              });

              $http({
                url: '/cool-flows/rest/proxy' + '?url=service/api/workflow/' + processName + '/formprocessor',
                method: 'POST',
                data: data
              }).success(function (data) {
                console.log(data);
              });

            } else {
              $scope.step = n;
            }
          };

        });

      });

  });
