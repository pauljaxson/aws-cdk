import { ArnPrincipal, Construct, PolicyPrincipal, PolicyStatement } from '@aws-cdk/cdk';
import { cloudformation } from './iam.generated';
import { IIdentityResource, IPrincipal, Policy } from './policy';
import { User } from './user';
import { AttachedPolicies, undefinedIfEmpty } from './util';

export interface GroupProps {
  /**
   * A name for the IAM group. For valid values, see the GroupName parameter
   * for the CreateGroup action in the IAM API Reference. If you don't specify
   * a name, AWS CloudFormation generates a unique physical ID and uses that
   * ID for the group name.
   *
   * If you specify a name, you must specify the CAPABILITY_NAMED_IAM value to
   * acknowledge your template's capabilities. For more information, see
   * Acknowledging IAM Resources in AWS CloudFormation Templates.
   *
   * @default Generated by CloudFormation (recommended)
   */
  groupName?: string;

  /**
   * A list of ARNs for managed policies associated with group.
   * @default No managed policies.
   */
  managedPolicyArns?: any[];

  /**
   * The path to the group. For more information about paths, see [IAM
   * Identifiers](http://docs.aws.amazon.com/IAM/latest/UserGuide/index.html?Using_Identifiers.html)
   * in the IAM User Guide.
   */
  path?: string;
}

export class Group extends Construct implements IIdentityResource, IPrincipal {
  /**
   * The runtime name of this group.
   */
  public readonly groupName: string;

  /**
   * The ARN of this group.
   */
  public readonly groupArn: string;

  /**
   * An "AWS" policy principal that represents this group.
   */
  public readonly principal: PolicyPrincipal;

  private readonly managedPolicies: any[];
  private readonly attachedPolicies = new AttachedPolicies();
  private defaultPolicy?: Policy;

  constructor(parent: Construct, name: string, props: GroupProps = {}) {
    super(parent, name);

    this.managedPolicies = props.managedPolicyArns || [];

    const group = new cloudformation.GroupResource(this, 'Resource', {
      groupName: props.groupName,
      managedPolicyArns: undefinedIfEmpty(() => this.managedPolicies),
      path: props.path,
    });

    this.groupName = group.groupName;
    this.groupArn = group.groupArn;
    this.principal = new ArnPrincipal(this.groupArn);
  }

  /**
   * Attaches a managed policy to this group.
   * @param arn The ARN of the managed policy to attach.
   */
  public attachManagedPolicy(arn: string) {
    this.managedPolicies.push(arn);
  }

  /**
   * Attaches a policy to this group.
   * @param policy The policy to attach.
   */
  public attachInlinePolicy(policy: Policy) {
    this.attachedPolicies.attach(policy);
    policy.attachToGroup(this);
  }

  /**
   * Adds a user to this group.
   */
  public addUser(user: User) {
    user.addToGroup(this);
  }

  /**
   * Adds an IAM statement to the default policy.
   */
  public addToPolicy(statement: PolicyStatement) {
    if (!this.defaultPolicy) {
      this.defaultPolicy = new Policy(this, 'DefaultPolicy');
      this.defaultPolicy.attachToGroup(this);
    }

    this.defaultPolicy.addStatement(statement);
  }
}
