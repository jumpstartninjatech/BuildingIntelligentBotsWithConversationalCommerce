using Autofac;
using Autofac.Integration.WebApi;
using Microsoft.Bot.Builder.Azure;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Builder.Dialogs.Internals;
using Microsoft.Bot.Connector;
using Microsoft.WindowsAzure.Storage;
using System.Configuration;
using System.Reflection;
using System.Web.Http;
using System;


namespace CommerceBot
{
    public class WebApiApplication : System.Web.HttpApplication
    {
        private const string BotStateTableName = "commercebot1";

        protected void Application_Start()
        {
            GlobalConfiguration.Configure(WebApiConfig.Register);
            string connectionString = ConfigurationManager.AppSettings["StorageConnectionString"];
            var config = GlobalConfiguration.Configuration;
            var store = new TableBotDataStore(connectionString, BotStateTableName);

            Conversation.UpdateContainer(
                builder =>
                    {
                        builder.RegisterModule(new AzureModule(Assembly.GetExecutingAssembly()));
                        //var store = new TableBotDataStore(ConfigurationManager.ConnectionStrings["StorageConnectionString"].ConnectionString);

                        builder.Register(c => store)
                           .Keyed<IBotDataStore<BotData>>(AzureModule.Key_DataStore)
                           .AsSelf()
                           .SingleInstance();
                    });

            //GlobalConfiguration.Configure(WebApiConfig.Register);

            //Conversation.UpdateContainer(
            //    builder =>
            //    {
            //        builder.Register(c => store)
            //                  .Keyed<IBotDataStore<BotData>>(AzureModule.Key_DataStore)
            //                  .AsSelf()
            //                  .SingleInstance();

            //        builder.Register(c => new CachingBotDataStore(store,
            //                   CachingBotDataStoreConsistencyPolicy
            //                   .ETagBasedConsistency))
            //                   .As<IBotDataStore<BotData>>()
            //                   .AsSelf()
            //                   .InstancePerLifetimeScope();

            //        builder.RegisterApiControllers(Assembly.GetExecutingAssembly());
            //        builder.RegisterWebApiFilterProvider(config);
            //    });
            //Conversation.UpdateContainer(
            //     builder =>
            //     {
            //         builder.Register(c => store)
            //            .Keyed<IBotDataStore<BotData>>(AzureModule.Key_DataStore)
            //            .AsSelf()
            //            .SingleInstance();

            //         builder.Register(c => new CachingBotDataStore(store,
            //                    CachingBotDataStoreConsistencyPolicy
            //                    .ETagBasedConsistency))
            //                    .As<IBotDataStore<BotData>>()
            //                    .AsSelf()
            //                    .InstancePerLifetimeScope();
            //         // Register your Web API controllers.

            //     });


        }
    }
}
