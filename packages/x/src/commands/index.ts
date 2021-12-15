import { ICommand } from "@bluelibs/terminal-bundle";
import * as Inquirers from "../inquirers";
import * as Writers from "../writers";
import { XSession } from "../utils/XSession";

const commands: ICommand[] = [
  {
    id: "x:project",
    inquirer: Inquirers.ProjectInquirer,
    writer: Writers.ProjectWriter,
  },
  {
    id: "x:microservice",
    inquirer: Inquirers.MicroserviceInquirer,
    writer: Writers.MicroserviceWriter,
  },
  {
    id: "x:bundle",
    inquirer: Inquirers.CreateBundleInquirer,
    writer: Writers.CreateBundleWriter,
  },
  {
    id: "x:collection",
    inquirer: Inquirers.CollectionInquirer,
    writer: Writers.CollectionWriter,
  },
  {
    id: "x:validator",
    inquirer: Inquirers.ValidatorInquirer,
    writer: Writers.ValidatorWriter,
  },
  {
    id: "x:graphql-input",
    inquirer: Inquirers.GraphQLInputInquirer,
    writer: Writers.GraphQLInputWriter,
  },
  {
    id: "x:graphql-entity",
    inquirer: Inquirers.GraphQLEntityInquirer,
    writer: Writers.GraphQLEntityWriter,
  },

  {
    id: "x:graphql-mutation",
    inquirer: Inquirers.GraphQLMutationInquirer,
    writer: Writers.GraphQLMutationWriter,
  },
  {
    id: "x:graphql-query",
    inquirer: Inquirers.GraphQLQueryInquirer,
    writer: Writers.GraphQLQueryWriter,
  },
  {
    id: "x:graphql-crud",
    inquirer: Inquirers.GraphQLCRUDInquirer,
    writer: Writers.GraphQLCRUDWriter,
  },
  {
    id: "x:service",
    inquirer: Inquirers.ServiceInquirer,
    writer: Writers.ServiceWriter,
  },
  {
    id: "x:server-route",
    inquirer: Inquirers.ServerRouteInquirer,
    writer: Writers.ServerRouteWriter,
  },
  {
    id: "x:listener",
    inquirer: Inquirers.ListenerInquirer,
    writer: Writers.ListenerWriter,
  },
  {
    id: "x:fixtures",
    inquirer: Inquirers.FixtureInquirer,
    writer: Writers.FixtureWriter,
  },
  {
    id: "x:event",
    inquirer: Inquirers.EventInquirer,
    writer: Writers.EventWriter,
  },
  {
    id: "x:exception",
    inquirer: Inquirers.ExceptionInquirer,
    writer: Writers.ExceptionWriter,
  },
  {
    id: "x:collection-link",
    inquirer: Inquirers.CollectionLinkInquirer,
    writer: Writers.CollectionLinkWriter,
  },
  {
    id: "x:email",
    inquirer: Inquirers.EmailTemplateInquirer,
    writer: Writers.EmailTemplateWriter,
  },
  {
    id: "blueprint:collection",
    inquirer: Inquirers.BlueprintCollectionInquirer,
    writer: Writers.BlueprintCollectionWriter,
  },
  {
    id: "blueprint:shared-model",
    inquirer: Inquirers.BlueprintSharedModelInquirer,
    writer: Writers.BlueprintSharedModelWriter,
  },
];

commands.map((command) => {
  command.sessionFactory = (container) => {
    return container.get(XSession);
  };
});

export default commands;
