import { expect, haveResource } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import { Test } from 'nodeunit';
import codedeploy = require('../../lib');

export = {
  "CodeDeploy Lambda Application": {
    "can be created"(test: Test) {
      const stack = new cdk.Stack();
      new codedeploy.LambdaApplication(stack, 'MyApp');
      expect(stack).to(haveResource('AWS::CodeDeploy::Application', {
        ComputePlatform: 'Lambda'
      }));
      test.done();
    },
    "can be created with explicit name"(test: Test) {
      const stack = new cdk.Stack();
      new codedeploy.LambdaApplication(stack, 'MyApp', {
        applicationName: 'my-name',
      });
      expect(stack).to(haveResource('AWS::CodeDeploy::Application', {
        ApplicationName: 'my-name',
        ComputePlatform: 'Lambda'
      }));
      test.done();
    },
  }
};
