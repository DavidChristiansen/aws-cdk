import cdk = require('@aws-cdk/core');

import { CfnMesh } from './appmesh.generated';
import { VirtualNode, VirtualNodeBaseProps } from './virtual-node';
import { VirtualRouter, VirtualRouterBaseProps } from './virtual-router';
import { VirtualService, VirtualServiceBaseProps } from './virtual-service';

/**
 * A utility enum defined for the egressFilter type property, the default of DROP_ALL,
 * allows traffic only to other resources inside the mesh, or API calls to amazon resources.
 *
 * @default DROP_ALL
 */
export enum MeshFilterType {
  /**
   * Allows all outbound traffic
   */
  ALLOW_ALL = 'ALLOW_ALL',
  /**
   * Allows traffic only to other resources inside the mesh, or API calls to amazon resources
   */
  DROP_ALL = 'DROP_ALL',
}

/**
 * Interface wich all Mesh based classes MUST implement
 */
export interface IMesh extends cdk.IResource {
  /**
   * The name of the AppMesh mesh
   *
   * @attribute
   */
  readonly meshName: string;

  /**
   * The Amazon Resource Name (ARN) of the AppMesh mesh
   *
   * @attribute
   */
  readonly meshArn: string;

  /**
   * Adds a VirtualRouter to the Mesh with the given id and props
   */
  addVirtualRouter(id: string, props?: VirtualRouterBaseProps): VirtualRouter;

  /**
   * Adds a VirtualService with the given id
   */
  addVirtualService(id: string, props?: VirtualServiceBaseProps): VirtualService;

  /**
   * Adds a VirtualNode to the Mesh
   */
  addVirtualNode(id: string, props?: VirtualNodeBaseProps): VirtualNode;
}

/**
 * Represents a new or imported AppMesh mesh
 */
abstract class MeshBase extends cdk.Resource implements IMesh {
  /**
   * The name of the AppMesh mesh
   */
  public abstract readonly meshName: string;

  /**
   * The Amazon Resource Name (ARN) of the AppMesh mesh
   */
  public abstract readonly meshArn: string;

  /**
   * Adds a VirtualRouter to the Mesh with the given id and props
   */
  public addVirtualRouter(id: string, props: VirtualRouterBaseProps = {}): VirtualRouter {
    return new VirtualRouter(this, id, {
      ...props,
      mesh: this,
    });
  }

  /**
   * Adds a VirtualService with the given id
   */
  public addVirtualService(id: string, props: VirtualServiceBaseProps = {}): VirtualService {
    return new VirtualService(this, id, {
      ...props,
      mesh: this,
    });
  }

  /**
   * Adds a VirtualNode to the Mesh
   */
  public addVirtualNode(id: string, props: VirtualNodeBaseProps = {}): VirtualNode {
    return new VirtualNode(this, id, {
      ...props,
      mesh: this,
    });
  }
}

/**
 * The set of properties used when creating a Mesh
 */
export interface MeshProps {
  /**
   * The name of the Mesh being defined
   *
   * @default - A name is autmoatically generated
   */
  readonly meshName?: string;

  /**
   * Egress filter to be applied to the Mesh
   *
   * @default DROP_ALL
   */
  readonly egressFilter?: MeshFilterType;
}

/**
 * Define a new AppMesh mesh
 *
 * @see https://docs.aws.amazon.com/app-mesh/latest/userguide/meshes.html
 */
export class Mesh extends MeshBase {
  /**
   * Import an existing mesh by arn
   */
  public static fromMeshArn(scope: cdk.Construct, id: string, meshArn: string): IMesh {
    const parts = cdk.Stack.of(scope).parseArn(meshArn);

    class Import extends MeshBase {
      public meshName = parts.resourceName || '';
      public meshArn = meshArn;
    }

    return new Import(scope, id);
  }

  /**
   * Import an existing mesh by name
   */
  public static fromMeshName(scope: cdk.Construct, id: string, meshName: string): IMesh {
    const arn = cdk.Stack.of(scope).formatArn({
      service: 'appmesh',
      resource: 'mesh',
      resourceName: meshName,
    });

    class Import extends MeshBase {
      public meshName = meshName;
      public meshArn = arn;
    }

    return new Import(scope, id);
  }

  /**
   * The name of the AppMesh mesh
   */
  public readonly meshName: string;

  /**
   * The Amazon Resource Name (ARN) of the AppMesh mesh
   */
  public readonly meshArn: string;

  constructor(scope: cdk.Construct, id: string, props: MeshProps = {}) {
    super(scope, id, {
      physicalName: props.meshName || cdk.Lazy.stringValue({ produce: () => this.node.uniqueId })
    });

    const mesh = new CfnMesh(this, 'Resource', {
      meshName: this.physicalName,
      spec: {
        egressFilter: props.egressFilter ? {
          type: props.egressFilter,
        } : undefined,
      },
    });

    this.meshName = this.getResourceNameAttribute(mesh.attrMeshName);
    this.meshArn = this.getResourceArnAttribute(mesh.ref, {
      service: 'appmesh',
      resource: 'mesh',
      resourceName: this.physicalName,
    });
  }
}